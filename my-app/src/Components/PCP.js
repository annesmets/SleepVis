import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { axisLeft, select } from 'd3';

const padding = 0;
const margins = Object.freeze({
    top: 20, 
    right: 20, 
    bottom: 50, 
    left: 20
}); 

const PCP = React.memo( (props) => {
    const data = props.data;
    const copy = props.copy;
    const width = props.width;
    const height = props.height;
    const keys = props.keys;
    const epsilon = props.epsilon;
    const groupLevel = props.groupLevel;
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const individualData = props.individualData;
    const clusterData = props.clusterData;
    const hovered = props.hovered;
    const onHovered = props.onHovered;
    const whiteList = props.whiteList;

    const svgPcp = useRef(); 

    const [selections, setSelections] = useState(new Map());
    const [brushSelection, setBrushSelection] = useState([]); 
    const [clientSelection, setClientSelection] = useState([]);
    const [clusterSelection, setClusterSelection] = useState([]);

    // Function to create the filter mask returned by the PCP
    const calculatePCPMask = (data, selected) => {
        return data.map(d => {
            return {
                id: d.id,
                value: selected.includes(d)
            }
        }) 
    };

    const brushHeight = 30;
    const innerHeight = height - margins.top - margins.bottom;
    const innerWidth = width - padding - margins.left - margins.right;

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    useEffect(() => {
        const svg = select(svgPcp.current);
        const content = svg.select('.content').attr('transform', `translate(${margins.left}, ${margins.top})`);

        if (data.length > 0) {
            // console.log(keysoriginal)
            // let keys;
            // if (keysoriginal.length === 1) {
            //     keys = keysoriginal.concat([keysoriginal[0]])
            // } else {
            //     keys = keysoriginal
            // }

            // console.log(keys)

            // Create x axis
            const x = d3.scalePoint()
                    .domain(keys)
                    .range([margins.left, innerWidth])

            // Create y axes
            let y = {}
            let i;
            for (i in keys) {
                let name = keys[i]
                
                y[name] = (name === 'lights_off_clus' || name === 'lights_on_clus')
                ? d3.scaleTime()
                    .domain(d3.extent(copy, d => d[name]))
                    .range([innerHeight, 0])
                    .nice()
                : d3.scaleLinear()
                    .domain(d3.extent(copy, d => d[name]))
                    .range([innerHeight, 0])
                    .nice()
            };

            // Function to create paths
            const line = (d) => {
                return d3.line()
                    (keys.map(p => {
                        return [x(p), y[p](d[p])]
                    }))
            };

            // Function to handle the brush
            const brushed = ({selection}, key) => {
                let selected = [];        // array containing the nights that fall between the interval [min, max]
                const selectedClient_id = [];
                const selectedCluster = [];

                if (selection === null) {
                    selections.delete(key)
                } else {
                    setSelections(new Map(selections.set(key, selection.map(y[key].invert))));
                };

                path.each(function(d) {
                    const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
                    // console.log(active)
                    // Push all active paths to selected
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
                        selections.delete(key)

                        path.each(function(d) {
                            const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
    
                            // Push all active paths to selected
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
                }  else if (groupLevel === 'cluster') {
                    if (selectedCluster.length === 0) {
                        selections.delete(key)

                        path.each(function(d) {
                            const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
        
                            // Push all active paths to selected
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
                        selections.delete(key)

                        path.each(function(d) {
                            const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
        
                            // Push all active paths to selected
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
            const brush = d3.brushY()
                .extent([
                    [-(brushHeight/2), 0],
                    [brushHeight/2, innerHeight]
                ])
                .on('end', brushed)

            let path;
            if (groupLevel === 'individual') {
                // Add path
                path = content
                    .selectAll('path')
                    .data(individualData.filter(d => d.cluster !== undefined))
                    .join('path')
                        .attr('stroke', 0.2)
                        .attr('opacity', 0.8)
                        .attr('fill', 'black')
                        .attr('d', line)
                        .style("fill", "none")
                        .style('stroke', d => clientSelection.includes(d.client_id) ? color(d['cluster']) : 'grey')
                        .style('stroke-width', d => clientSelection.includes(d.client_id) ? 0.8 : 0.6)
                        .style('opacity', d => clientSelection.includes(d.client_id) ? 0.8 : 0.6)
            } else if (groupLevel === 'cluster') {
                // Add path
                path = content
                    .selectAll('path')
                    .data(clusterData.filter(d => d.cluster !== undefined))
                    .join('path')
                        .attr('stroke', 0.2)
                        .attr('opacity', 0.8)
                        .attr('fill', 'black')
                        .attr('d', line)
                        .style("fill", "none")
                        .style('stroke', d => clusterSelection.includes(d.cluster) ? color(d['cluster']) : 'grey')
                        .style('stroke-width', d => clusterSelection.includes(d.cluster) ? 0.8 : 0.6)
                        .style('opacity', d => clusterSelection.includes(d.cluster) ? 0.8 : 0.6)
            } else {
                // Add path
                path = content
                    .selectAll('path')
                    .data(data.filter(d => d.cluster !== undefined))
                    .join('path')
                        .attr('stroke', 0.2)
                        .attr('opacity', 0.8)
                        .attr('fill', 'black')
                        .attr('d', line)
                        .style("fill", "none")
                        .style('stroke', d => brushSelection.includes(d) ? (hovered === d.id ? 'red' : color(d['cluster'])) : (hovered === d.id ? 'red' : 'grey'))
                        .style('stroke-width', d => brushSelection.includes(d) ? 0.8 : (hovered === d.id ? 3 : 0.1))
                        .style('opacity', d => brushSelection.includes(d) ? 0.8 : (hovered === d.id ? 0.8 : 0.6))
                        .style('cursor', 'pointer')
                        .on('click', (d,e) => onHovered(e.id === hovered ? 0 : e.id))
            };

            path.selectAll('.pathTitle')
                .data(d => groupLevel === 'individual' ? [['Subject ID: ' + d.client_id]] : (groupLevel === 'cluster' ? [['Cluster: ' + d.cluster]] :[['Subject ID: ' + d.client_id + ', Date: ' + d.date]]))
                .join('title')
                .attr('class', 'pathTitle')
                .text((d,e) => d)

            // console.log(path.data())
            // console.log(clientSelection)
                 
            // Add axes
            const axes = svg
                .selectAll('.axis')
                .data(keys)
                .join('g')
                .attr('class', 'axis')
                .attr('transform', d => `translate(${x(d) + margins.left}, ${margins.top})`)
                .each(function(d) { 
                    d3.select(this).call((d === 'lights_off_clus' || d === 'lights_on_clus') ? axisLeft(y[d]).tickFormat(d3.timeFormat('%H:%M')) : axisLeft(y[d])); 
                })

            axes.call(brush)
            
            // Add titles to the x axis
            svg.selectAll('.xTitle')
                .data(keys)
                .join('text')
                .attr('class', 'xTitle')
                .style('text-anchor', (d,i) => {
                    if (i === 0){
                        return 'start'
                    } else if (i === keys.length-1) {
                        return 'end'
                    } else {
                        return 'middle'
                    }
                })
                .attr('x', (d,i) => i === keys.length -1 ? x(d) + 20 : x(d))
                .attr('y', innerHeight+ margins.bottom + 5)
                .text(d => (whiteList.find(e => e.value === d)).name)
                            
        } else {
            content.selectAll('path').remove()
        }
    }, [data, innerHeight, innerWidth, keys, epsilon, groupLevel, brushSelection, clientSelection, copy, filterMasks, individualData, setFilterMasks, selections, clusterData, hovered, onHovered, whiteList])

    return (
        <svg className='pcp' width={width} height={height} ref={svgPcp}>
            <defs>
                <clipPath id='pcp'>
                    <rect x={0} y={0} width={innerWidth} height={innerHeight} />
                </clipPath>
            </defs>
            <g className='content' clipPath='url(#pcp)' />
        </svg>
    )
});

export default PCP;