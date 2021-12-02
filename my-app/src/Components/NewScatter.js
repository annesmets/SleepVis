import React,{ useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { axisBottom, axisLeft, select } from 'd3';

const padding = 0;
const margins = Object.freeze({
    top: 20, 
    right: 20, 
    bottom: 50, 
    left: 60
}); 

const NewScatter = (props) => {    
    const data = props.data;
    const copy = props.copy;
    const width = props.width;
    const height = props.height;
    const keys = props.keys;
    const individualData = props.individualData;
    const clusterData = props.clusterData;
    const groupLevel = props.groupLevel;
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const hovered = props.hovered;
    const onHovered = props.onHovered;
    const whiteList = props.whiteList;

    const svgScatter = useRef(); 

    // Selection of the brush
    const [selections, setSelections] = useState(new Map());
    const [clientSelection, setClientSelection] = useState([]);
    const [clusterSelection, setClusterSelection] = useState([]);
    const [brushSelection, setBrushSelection] = useState([]); 

    // Function to create the filter mask returned by the scatter plot
    const calculatePCPMask = (data, selected) => {
        return data.map(d => {
            return {
                id: d.id,
                value: selected.includes(d)
            }
        }) 
    };

    const innerHeight = height - margins.top - margins.bottom;
    const innerWidth = width - padding - margins.left - margins.right;

    // This effect will render the visualization and contains all the D3 code
    useEffect(() => {
        const svg = select(svgScatter.current)
        const content = svg.select('.content').attr('transform', `translate(${margins.left}, ${margins.top})`);

        // Color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10)

        if (data.length > 0 && keys.length > 0 && keys.length < 3) {
            let yparam;
            let xparam;
            if (keys.length === 1) {
                yparam = keys[0]
                xparam = keys[0]
            } else {
                yparam = keys[0]
                xparam = keys[1]
            }

            const minY = d3.min(copy, d => d[yparam])
            const maxY = d3.max(copy, d => d[yparam])

            const minX = d3.min(copy, d => d[xparam])
            const maxX = d3.max(copy, d => d[xparam])

            // Define x axis scale
            const x = (xparam === 'lights_off_clus' || xparam === 'lights_on_clus')
            ? d3.scaleTime()
                .domain([minX, maxX]).nice()
                .range([padding, innerWidth-padding])
            : d3.scaleLinear()
                .domain([minX, maxX]).nice()
                .range([padding, innerWidth-padding]);

            // Define y axis scale
            const y = (yparam === 'lights_off_clus' || yparam === 'lights_on_clus')
                ? d3.scaleTime()
                    .domain([minY, maxY]).nice()
                    .range([innerHeight, 0])
                : d3.scaleLinear()
                    .domain([minY, maxY]).nice()
                    .range([innerHeight, 0])

            // Define axes and what scales to use. 
            // If the parameter on the axis is time-related (such as lights_off etc.)
            // Then change the tickformat to HH:MM
            const xAxis = (svg) => (xparam === 'lights_off_clus' || xparam === 'lights_on_clus') 
                ? svg.call(axisBottom(x)
                    .tickFormat(d3.timeFormat('%H:%M')))
                : svg.call(axisBottom(x));

            const yAxis = (svg) => (yparam === 'lights_off_clus' || yparam === 'lights_on_clus') 
                ? svg.call(axisLeft(y)
                    .tickFormat(d3.timeFormat('%H:%M')))
                : svg.call(axisLeft(y));

            let dot;
            if (groupLevel === 'individual') {
                dot = content.selectAll('.dots')
                    .data(individualData.filter(d => d.cluster !== undefined))     
                    .join('circle')
                    .attr('class', 'dots')
                    .attr('cy', d => y(d[yparam]))
                    .attr('cx', d => x(d[xparam]))
                    .attr('r', 3)    
                    .attr('fill', d => clientSelection.includes(d.client_id) ? color(d['cluster']) : 'grey')
                    .style('opacity', d => clientSelection.includes(d.client_id) ? 0.8 : 0.5)
            } else if (groupLevel === 'cluster') {
                dot = content.selectAll('.dots')
                    .data(clusterData.filter(d => d.cluster !== undefined))      
                    .join('circle')
                    .attr('class', 'dots')
                    .attr('cy', d => y(d[yparam]))
                    .attr('cx', d => x(d[xparam]))
                    .attr('r', 3)    
                    .attr('fill', d => clusterSelection.includes(d.cluster) ? color(d['cluster']) : 'grey') 
                    .style('opacity', d => clusterSelection.includes(d.cluster) ? 0.8 : 0.5)
            } else {
                dot = content.selectAll('.dots')
                    .data(data.filter(d => d.cluster !== undefined))      
                    .join('circle')
                    .attr('class', 'dots')
                    .attr('cy', d => y(d[yparam]))
                    .attr('cx', d => x(d[xparam]))
                    .attr('r', 3)    
                    .attr('stroke', d => d.id === hovered ? 'red' : 'grey')
                    .attr('stroke-width', d => d.id === hovered ? 3 : 0)
                    .attr('fill', d => brushSelection.includes(d) ? color(d['cluster']) : 'grey') 
                    .style('opacity', d => brushSelection.includes(d) ? 0.8 : 0.5)
                    .style('cursor', 'pointer')
                    // .on('click', (d,e) => onHovered(e.id === hovered ? 0 : e.id))

                dot.selectAll('.dotTitle')
                    .data(d => [['Subject ID: ' + d.client_id + ', Cluster: ' + d.cluster + ', Date: ' + d.date]])
                    .join('title')
                    .attr('class', 'dotTitle')
                    .text((d,e) => d)

                    // .append("title")
                    // .text((d,e) => 'Client ID: ' + d.client_id)
            };

            // console.log(dot.data())
            // console.log(clusterSelection)

            // Function to handle the brush
            const brushed = ({selection}) => {
                let selected = [];
                const selectedClient_id = [];
                const selectedCluster = [];

                if (selection === null) {
                    selections.delete(xparam)
                    selections.delete(yparam)
                } else {
                    setSelections(new Map(selections.set(xparam, [x.invert(selection[1][0]), x.invert(selection[0][0])])));
                    setSelections(new Map(selections.set(yparam, [y.invert(selection[0][1]), y.invert(selection[1][1])])));
                };

                dot.each(function(d) {
                    const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
                    
                    // Push all active dots to selected
                    if (active) {
                        if (groupLevel === 'individual') {
                            selectedClient_id.push(d.client_id)
                        } else if (groupLevel === 'cluster') {
                            selectedCluster.push(d.cluster)
                        } else {
                            selected.push(d)
                        }
                        d3.select(this).raise()
                    };
                });

                if (groupLevel === 'individual') {
                    if (selectedClient_id.length === 0) {
                        selections.delete(xparam)
                        selections.delete(yparam)
    
                        dot.each(function(d) {
                            const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
                            
                            // Push all active dots to selected
                            if (active) {
                                selectedClient_id.push(d.client_id)
                                d3.select(this).raise()
                            };
                        });
                    }
                    // Pass all nights of the client_ids that are selected to the other components via selected
                    selected = data.filter(d => selectedClient_id.includes(d.client_id))
                    // Push the selected client_id such to be able to color the selected lines
                    setClientSelection(selectedClient_id)
                } else if (groupLevel === 'cluster') {
                    if (selectedCluster.length === 0) {
                        selections.delete(xparam)
                        selections.delete(yparam)
    
                        dot.each(function(d) {
                            const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
                            
                            // Push all active dots to selected
                            if (active) {
                                selectedCluster.push(d.cluster)
                                d3.select(this).raise()
                            };
                        });
                    }
                    // Pass all nights of the client_ids that are selected to the other components via selected
                    selected = data.filter(d => selectedCluster.includes(d.cluster))
                    // Push the selected client_id such to be able to color the selected lines
                    setClusterSelection(selectedCluster)
                } else {
                    if (selected.length === 0) {
                        selections.delete(xparam)
                        selections.delete(yparam)
    
                        dot.each(function(d) {
                            const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
                            
                            // Push all active dots to selected
                            if (active) {
                                selected.push(d)
                                d3.select(this).raise()
                            };
                        });
                    }
                    // Set the selected nights to brushSelection to color the selected lines
                    setBrushSelection(selected)
                };

                // Set the selected nights to true in the filter masks
                setFilterMasks({...filterMasks, 'pcp': calculatePCPMask(copy, selected)})
            };
            
            // Brush
            const brush = d3.brush()
                .extent([[0,0], [innerWidth, innerHeight]])
                .on('end', brushed);

            // Call the brush on the plot
            content.call(brush)

            // Add the x axis
            svg.select('g.xAxis')
                .call(xAxis)
                .attr('transform', `translate(${margins.left}, ${innerHeight+margins.top})`)
            
            // Add title to the x axis
            svg.selectAll('.xTitle')
                .data([xparam])
                .join('text')
                .attr('class', 'xTitle')
                .style('text-anchor', 'middle')
                .attr('x', width/2)
                .attr('y', innerHeight + margins.bottom + 5)
                .text(d => (whiteList.find(e => e.value === d)).name)

            // Add the y axis
            svg.select('g.yAxis')
                .call(yAxis)
                .attr('transform', `translate(${margins.left}, ${margins.top})`);

            // Add title to the y axis
            svg.selectAll('.yTitle')
                .data([yparam])
                .join('text')
                .attr('class', 'yTitle')
                .style('text-anchor', 'middle')
                .attr('x', -height/2)
                .attr('y', margins.left/2 - 12)
                .attr('transform', 'rotate(-90)')
                .text(d => (whiteList.find(e => e.value === d)).name)

        } else {
            svg.selectAll('circle').remove()
        };
    }, [data, width, height, innerHeight, innerWidth, props, keys, groupLevel, individualData, clusterData, copy, brushSelection, clientSelection, clusterSelection, filterMasks, selections, setFilterMasks, hovered, onHovered, whiteList]);

    return (
        <>
            <svg className='scatter' width={width} height={height} ref={svgScatter}>
                <defs>
                    <clipPath id='scatter'>
                        <rect x={0} y={0} width={innerWidth} height={innerHeight} />
                    </clipPath>
                </defs>
                <g className='content' clipPath='url(#scatter)' />
                <g className='xAxis' />
                <g className='yAxis' />
            </svg>
        </>
    );
};

export default NewScatter;