'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ReasoningStep } from '@/lib/api';

interface EntropyChartProps {
  steps: ReasoningStep[];
}

export function EntropyChart({ steps }: EntropyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    svg.attr('width', container.clientWidth).attr('height', container.clientHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const data = steps.filter(s => s.entropy !== null);

    const x = d3.scaleBand()
      .domain(data.map(d => `Step ${d.id}`))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.entropy!) || 5])
      .nice()
      .range([height, 0]);

    // Grid lines
    g.selectAll('.grid-line')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#242424')
      .attr('stroke-dasharray', '2,2');

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('x', d => x(`Step ${d.id}`)!)
      .attr('y', d => y(d.entropy!))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.entropy!))
      .attr('rx', 4)
      .attr('fill', d => {
        if (d.entropy! > 3) return '#ef4444';
        if (d.entropy! > 1.5) return '#f59e0b';
        return '#00c897';
      })
      .attr('fill-opacity', 0.7);

    // Value labels on bars
    g.selectAll('.bar-label')
      .data(data)
      .join('text')
      .attr('x', d => x(`Step ${d.id}`)! + x.bandwidth() / 2)
      .attr('y', d => y(d.entropy!) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '11px')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .text(d => d.entropy!.toFixed(2));

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .call((gGroup) => gGroup.select('.domain').attr('stroke', '#242424'))
      .call((gGroup) => gGroup.selectAll('.tick line').attr('stroke', '#242424'))
      .call((gGroup) => gGroup.selectAll('.tick text').attr('fill', '#888').attr('font-size', '11px').attr('font-family', 'IBM Plex Mono, monospace'));

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((gGroup) => gGroup.select('.domain').attr('stroke', '#242424'))
      .call((gGroup) => gGroup.selectAll('.tick line').attr('stroke', '#242424'))
      .call((gGroup) => gGroup.selectAll('.tick text').attr('fill', '#888').attr('font-size', '11px').attr('font-family', 'IBM Plex Mono, monospace'));

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#555')
      .attr('font-size', '12px')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .text('Entropy');

  }, [steps]);

  return (
    <div className="entropy-container" style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} className="entropy-svg" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
