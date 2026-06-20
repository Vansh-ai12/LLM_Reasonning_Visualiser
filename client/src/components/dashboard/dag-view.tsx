/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ReactFlow, useNodesState, useEdgesState, Background, Controls, Handle, Position, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { ReasoningStep } from '@/lib/api';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 90;
const nodeHeight = 90;

const colorMap: Record<string, string> = {
  hypothesis: '#3b82f6', // blue
  lookup: '#8b5cf6',     // purple
  calculation: '#eab308',// yellow
  correction: '#ef4444', // red
  conclusion: '#10b981', // green
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// Custom Node component (Neo4j Style)
function CustomNode({ data }: any) {
  const color = colorMap[data.type] || '#3b82f6';

  return (
    <div style={{
      width: `${nodeWidth}px`, 
      height: `${nodeHeight}px`, 
      borderRadius: '50%',
      backgroundColor: color,
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      cursor: 'pointer',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      
      <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', padding: '0 8px', textTransform: 'uppercase' }}>
        {data.type === 'conclusion' && data.id === data.totalSteps ? 'FINAL' : data.type}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
        ID: {data.id}
      </div>
      
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

interface DAGViewProps {
  steps: ReasoningStep[];
}

function DAGViewInner({ steps }: DAGViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  const { fitView } = useReactFlow();
  const initialized = useRef(false);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node.data.step);
  }, []);

  useEffect(() => {
    if (!steps || steps.length === 0) return;

    const initialNodes = steps.map((step) => ({
      id: step.id.toString(),
      type: 'custom',
      data: { 
        id: step.id, 
        type: step.type, 
        step: step,
        totalSteps: steps.length
      },
      position: { x: 0, y: 0 },
    }));

    const initialEdges: any[] = [];
    
    steps.forEach((step) => {
      let deps: any[] = [];
      try {
        const parsed = JSON.parse(step.depends_on || '[]');
        deps = Array.isArray(parsed) ? parsed : [];
      } catch {
        deps = [];
      }
      deps.forEach(dep => {
        const sourceStep = steps.find(s => s.id === dep);
        const sourceColor = sourceStep ? (colorMap[sourceStep.type] || '#3b82f6') : 'var(--text-secondary)';

        initialEdges.push({
          id: `e${dep}-${step.id}`,
          source: dep.toString(),
          target: step.id.toString(),
          animated: true,
          style: { stroke: sourceColor, strokeWidth: 2 }
        });
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Force fitView after setting nodes so they are always centered
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
      initialized.current = true;
    }, 50);
  }, [steps, setNodes, setEdges, fitView]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#1a1a1a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        minZoom={0.1}
      >
        <Background gap={16} color="#333" />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '320px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          zIndex: 10,
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--bg-border)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Step {selectedNode.id} Details</h3>
            <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div><strong style={{ color: 'var(--text-secondary)' }}>Type:</strong> <span style={{ textTransform: 'capitalize', color: colorMap[selectedNode.type] || 'var(--accent)' }}>{selectedNode.type}</span></div>
            <div><strong style={{ color: 'var(--text-secondary)' }}>Label:</strong> {selectedNode.label}</div>
            
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Content:</strong>
              <div style={{ backgroundColor: 'var(--bg-base)', padding: '8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto', marginTop: '4px', border: '1px solid var(--bg-border)' }}>
                {selectedNode.content}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              <div style={{ backgroundColor: 'var(--bg-base)', padding: '8px', borderRadius: '6px', border: '1px solid var(--bg-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Entropy</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedNode.entropy !== null && selectedNode.entropy !== undefined ? selectedNode.entropy.toFixed(4) : 'N/A'}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-base)', padding: '8px', borderRadius: '6px', border: '1px solid var(--bg-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Confidence</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize' }}>{selectedNode.confidence || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DAGView({ steps }: DAGViewProps) {
  return (
    <ReactFlowProvider>
      <DAGViewInner steps={steps} />
    </ReactFlowProvider>
  );
}
