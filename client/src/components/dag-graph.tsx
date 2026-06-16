'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface DagNode {
  id: string;
  label: string;
  type: 'hypothesis' | 'lookup' | 'calculation' | 'correction' | 'conclusion';
}

export interface DagLink {
  source: string;
  target: string;
}

interface DagGraphProps {
  nodes: DagNode[];
  links: DagLink[];
}

const NODE_COLORS: Record<DagNode['type'], string> = {
  hypothesis: '#6b8afd',
  lookup: '#f0a500',
  calculation: '#00c897',
  correction: '#ff4d4d',
  conclusion: '#c084fc',
};

interface LayoutNode extends DagNode {
  x: number;
  y: number;
}

function buildLayout(
  nodes: DagNode[],
  links: DagLink[],
  width: number,
  height: number,
): { layoutNodes: LayoutNode[]; layoutLinks: DagLink[] } {
  const layers = new Map<string, number>();
  const incoming = new Map<string, number>();

  nodes.forEach((node) => incoming.set(node.id, 0));
  links.forEach((link) => {
    incoming.set(link.target, (incoming.get(link.target) ?? 0) + 1);
  });

  const roots = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const queue = roots.map((node) => ({ id: node.id, layer: 0 }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    layers.set(current.id, Math.max(layers.get(current.id) ?? 0, current.layer));

    links
      .filter((link) => link.source === current.id)
      .forEach((link) => {
        queue.push({ id: link.target, layer: current.layer + 1 });
      });
  }

  nodes.forEach((node) => {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  });

  const grouped = new Map<number, DagNode[]>();
  nodes.forEach((node) => {
    const layer = layers.get(node.id) ?? 0;
    const group = grouped.get(layer) ?? [];
    group.push(node);
    grouped.set(layer, group);
  });

  const layerCount = grouped.size || 1;
  const layerGap = height / (layerCount + 1);

  const layoutNodes: LayoutNode[] = [];

  grouped.forEach((group, layer) => {
    const xGap = width / (group.length + 1);
    group.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        x: xGap * (index + 1),
        y: layerGap * (layer + 1),
      });
    });
  });

  return { layoutNodes, layoutLinks: links };
}

export function DagGraph({ nodes, links }: DagGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;
    if (!container || !svgElement || nodes.length === 0) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const { layoutNodes, layoutLinks } = buildLayout(nodes, links, width, height);

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    svg
      .append('defs')
      .append('marker')
      .attr('id', 'dag-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 6)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#555555');

    const nodeById = new Map(layoutNodes.map((node) => [node.id, node]));

    const linkGroup = svg.append('g').attr('class', 'dag-links');

    linkGroup
      .selectAll('path')
      .data(layoutLinks)
      .enter()
      .append('path')
      .attr('class', 'dag-link')
      .attr('fill', 'none')
      .attr('stroke', '#3a3a3a')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#dag-arrow)')
      .attr('d', (link) => {
        const source = nodeById.get(link.source);
        const target = nodeById.get(link.target);
        if (!source || !target) {
          return '';
        }

        const midY = (source.y + target.y) / 2;
        return `M ${source.x} ${source.y + 22} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y - 22}`;
      });

    const nodeGroup = svg.append('g').attr('class', 'dag-nodes');

    const node = nodeGroup
      .selectAll('g')
      .data(layoutNodes)
      .enter()
      .append('g')
      .attr('class', 'dag-node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    node
      .append('rect')
      .attr('x', -88)
      .attr('y', -22)
      .attr('width', 176)
      .attr('height', 44)
      .attr('rx', 6)
      .attr('fill', '#141414')
      .attr('stroke', (d) => NODE_COLORS[d.type])
      .attr('stroke-width', 1.5);

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-2')
      .attr('fill', '#888888')
      .attr('font-size', '11px')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .text((d) => d.type);

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '14')
      .attr('fill', '#f0f0f0')
      .attr('font-size', '13px')
      .attr('font-family', 'Geist, sans-serif')
      .text((d) => (d.label.length > 22 ? `${d.label.slice(0, 22)}…` : d.label));

    const resize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      const nextLayout = buildLayout(nodes, links, nextWidth, nextHeight);
      const nextNodeById = new Map(nextLayout.layoutNodes.map((n) => [n.id, n]));

      svg.attr('width', nextWidth).attr('height', nextHeight);

      linkGroup
        .selectAll<SVGPathElement, DagLink>('path')
        .attr('d', (link) => {
          const source = nextNodeById.get(link.source);
          const target = nextNodeById.get(link.target);
          if (!source || !target) {
            return '';
          }

          const midY = (source.y + target.y) / 2;
          return `M ${source.x} ${source.y + 22} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y - 22}`;
        });

      nodeGroup
        .selectAll<SVGGElement, LayoutNode>('g')
        .attr('transform', (d) => {
          const positioned = nextNodeById.get(d.id);
          if (!positioned) {
            return 'translate(0,0)';
          }
          return `translate(${positioned.x}, ${positioned.y})`;
        });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [nodes, links]);

  if (nodes.length === 0) {
    return (
      <div className="dag-empty">
        <p className="dag-empty-title">No reasoning graph yet</p>
        <p className="dag-empty-text">
          Run a trace to generate nodes and edges. The DAG will render here with
          D3.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="dag-canvas">
      <svg ref={svgRef} className="dag-svg" role="img" aria-label="Reasoning DAG" />
    </div>
  );
}

export const MOCK_DAG_NODES: DagNode[] = [
  { id: '1', label: 'Parse the question', type: 'hypothesis' },
  { id: '2', label: 'Retrieve supporting facts', type: 'lookup' },
  { id: '3', label: 'Compute intermediate value', type: 'calculation' },
  { id: '4', label: 'Correct prior assumption', type: 'correction' },
  { id: '5', label: 'State final answer', type: 'conclusion' },
];

export const MOCK_DAG_LINKS: DagLink[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '3', target: '4' },
  { source: '4', target: '5' },
];
