import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { axisLeft, select } from 'd3';
import { Grid } from '@material-ui/core';

const isEqual = require('lodash/isEqual');

const margins = Object.freeze({
    top: 10, 
    right: 150, 
    bottom: 10, 
    left: 60
}); 

const Icicle = (props) => {
    const width = props.width;
    const height = props.height;
    const epsilon = props.epsilon;
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const dataFilter = props.dataFilter;
    const copy = props.data;
    let data = (props.data).filter(d => {return (dataFilter.includes(d.id))});
    const includeNoise = props.includeNoise;

    const svgIcicle = useRef();

    const [selectedSequence, setSelectedSequence] = useState([]);
    const [selectedCluster, setSelectedCluster] = useState([]);

    const useStyles = makeStyles((theme) => ({
        formControl: {
          minWidth: 300,
        },
        root: {
            '& > *': {
              minWidth: 200
            },
            position: 'absolute',
            top: 20,
            left: 740
          }
      }));
  
    const classes = useStyles();
    
    const legendSize = 16;
    const innerHeight = height - margins.top - margins.bottom;
    const innerWidth = width - margins.left - margins.right;

    // Create color scale
    const color = d3.scaleOrdinal()
        .domain(['outOfBed_on', 'outOfBed_off', 'awakeInBed_on', 'awakeInBed_off', 'sleep_on', 'sleep_off'])
        .range(['#b2df8a', '#33a02c', '#fdbf6f', '#ff7f00', '#a6cee3', '#1f78b4']); 

    // Calculate the filter mask
    const calculateIcicleMask = (cluster, data) => {
        return data.map(d => {
            return {
                id: d.id,
                value: cluster.length === 0 ? true : cluster[0] === d.cluster
            }
        })
    };

    // Calculate the filter mask when a sequence is selected
    const calculateIcicleSequenceMask = (sequence, data) => {
        return data.map(d => {
            return {
                id: d.id,
                value: sequence.length === 0 ? true : JSON.stringify(sequence) === JSON.stringify(d.states_array)
            }
        })
    };

    const clearSelection = () => {
        setSelectedSequence([]);
        setSelectedCluster([])
        setFilterMasks({...filterMasks, 'icicle': calculateIcicleSequenceMask([], copy)})
    };

    useEffect(() => {
        // Set the filtermask when a cluster is selected
        const clickCluster = (cluster) => {
            setFilterMasks({...filterMasks, 'icicle': calculateIcicleMask(cluster, copy)})
        };

        // Set the filtermask when a sequence is selected
        const clickSequence = (sequence) => {
            setFilterMasks({...filterMasks, 'icicle': calculateIcicleSequenceMask(sequence, copy)})
        };

        const svg = select(svgIcicle.current)
        const content = svg.select('.content')

        if (data.length > 0) {
            if(includeNoise === 'exclude') {
                data = data.filter(d => d.cluster !== 'N')
            };

            svg.selectAll('.legend').remove()       //Clear legend before adding new legend
            
            const element = svg.node();
            element.value = { sequence: [], percentage: 0.0}

            // Group by cluster, then by states array and get the # of occurence for each unique sequence
            const grouped = d3.rollups(data, v => v.length, d => d.cluster, d => d.states_array.toString());

            // Get all the clusters [0,1,2,3...]
            const clusters = grouped.map(d => d[0])

            // Define y axis scale for the clusters
            const y = d3.scaleBand()
                .domain(clusters)
                .range([height, 0])
                .padding(0.1);      // Padding between the clusters

            // Create the y axis
            const yAxisCluster = (svg) => svg
                .call(axisLeft(y)
                    .tickSizeInner(0)
                    .tickSizeOuter(0));

            // Add the y axis
            svg.select('g.yAxisCluster')
                .call(yAxisCluster)
                .call(svg => svg.select('.domain').remove())
                .attr('transform', `translate(${margins.left}, 0)`)
            
            // Add title to the y axis
            svg.selectAll('.yTitle')
                .data(['Cluster'])
                .join('text')
                .attr('class', 'yTitle')
                .style('text-anchor', 'middle')
                .attr('x', -height/2)
                .attr('y', margins.left/2-5)
                .attr('transform', 'rotate(-90)')
                .text(d => d)

            // Make the clusters on the y axis clickable
            svg.selectAll('.tick')
                .style('cursor', 'pointer')
                .on('click', (d,i) => {
                    let cluster = isEqual([i], selectedCluster) ? [] : [i];
                    setSelectedCluster(cluster)
                    clickCluster(cluster)
                })
                .style('color', (d) => selectedCluster.includes(d) ? 'red' : 'black')

            // Build hierarchy for an individual cluster
            const buildHierarchy = (list) => {
                const root = { name: 'root', children: [] };

                for (let i=0; i<list.length; i++) {

                    const sequence = list[i][0];            // each unique sequence
                    const count = list[i][1];               // # of occurence of each unique sequence
                    if (isNaN(count)) {
                        continue;
                    }
                    const parts = sequence.split(',')       // Get array of states ['sleep', 'awakeInBed']

                    let currentNode = root;

                    for (let j=0; j<parts.length; j++) {
                        const children = currentNode['children'];
                        const nodeName = parts[j]
                        let childNode = null;

                        if (j+1 < parts.length) {

                            // If not yet at the end of the sequence; move down the tree
                            let foundChild = false;

                            for (let k=0; k<children.length; k++) {
                                if (children[k]['name'] === nodeName) {
                                    childNode = children[k];
                                    foundChild = true;
                                    break;
                                }
                            };

                            // If we don't already have a child node for this branch, create it
                            if (!foundChild) {
                                childNode = { name: nodeName, children: [] };
                                children.push(childNode);
                            };

                            currentNode = childNode;
                        } else {
                            // Reached the end of the sequence; create a leaf node
                            childNode = { name: nodeName, value: count };
                            children.push(childNode);
                        };
                    }
                }
                return root;
            };

            // For each cluster, build an hierarchy. The input list should be sorted on # of events in the sequence (most --> least)
            let hierarchies = [];

            clusters.forEach(cluster => {
                for (let i=0; i<grouped.length; i++) {
                    if (grouped[i][0] === cluster) {
                        return hierarchies[i] = buildHierarchy( grouped[i][1].sort((a,b) => {return b[0].split(',').length - a[0].split(',').length} )) 
                    }
                };
            });

            // Function that returns a partition for each hierarchy
            const buildPartition = (h) => {
                return d3.partition()
                    .size([y.bandwidth(), innerWidth])
                    .padding(1)
                    (d3.hierarchy(h)
                        .sum(d => d.value)
                        .sort((a, b) => b.value - a.value))
            };

            // For each hierarchy, build a partition. So you get one partition for each cluster
            let partitions = [];
            hierarchies.forEach((hierarchy, i) => {return partitions[i] = buildPartition(hierarchy)})

            // For each cluster, transform the cell so that it has the correct y position
            const cell = content
                .selectAll('.cell')
                .data(partitions, d => d.descendants())
                .join('g')
                .attr('class', 'cell')
                .attr('transform', (d,i) => `translate(${margins.left - d.y1}, ${y(clusters[i])})`)   //Move to the left to make up for the width of the root node
            
            // Create rect elements 
            const state = cell.selectAll('.rect')
                .data(d => d.descendants().filter(e => {return e.depth}))       //Don't draw the root node
                .join('rect')
                .attr('class', 'rect')
                .attr('x', d => d.y0)
                .attr('y', d => d.x0)
                .attr("width", d => d.y1 - d.y0)
                .attr("height", d => d.x1 - d.x0)
                .style('cursor', (e,d) => e.descendants().length === 1 ? 'pointer' : 'default')     //Only pointer on last event such that you can't click the other events in a sequence
                .on('click', (e,d) => {
                    let sequence = d
                        .ancestors()
                        .reverse()
                        .slice(1);

                    // Such that you can only click on the last event of a sequence
                    if (d.descendants().length === 1) {
                        // Array containing selected states array ('sleep', 'awakeInBed') etc. 
                        let sequenceStates = Array.from(sequence.map(d => {
                            return d.data.name
                        }))

                        // If the same sequence is selected again, clear the selection
                        // Otherwise, update the selected sequence 
                        if (JSON.stringify(sequenceStates) === JSON.stringify(selectedSequence)) {
                            sequenceStates = [];
                            sequence = [];
                            setSelectedSequence(sequenceStates);
                        } else {
                            setSelectedSequence(sequenceStates);
                        }

                        // If nothing selected, opacity is 1
                        // Otherwise, set only selected opacity to 1
                        state.attr('opacity', node => {
                            if (sequence.length === 0) {
                                return 1
                            } else {
                                return sequence.indexOf(node) >= 0 ? 1 : 0.2
                            }
                        })
                        clickSequence(sequenceStates)
                    } 
                })
                .attr("fill", d => {
                    if (!d.depth) return "#ccc";
                    return color(d.data.name);
                })

            // Set opacity to 1 on clear selection
            if (selectedSequence.length === 0) {
                svg.selectAll('rect').attr('opacity', 1)
            }
            
            // Create legend
            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${width-180}, ${height-135})`)
                .selectAll('.legend')
                .join('g')

            // Add the legend rectangles
            legend.append('rect')
                .data(color.domain())
                .join('rect')
                    .attr('x', 0)
                    .attr('y', (d, i) => i*(legendSize+5))
                    .attr('width', legendSize)
                    .attr('height', legendSize)
                    .attr('fill', d => color(d))
                    .attr("stroke", 'white');

            // Add the legend labels
            legend.append('.text')
                .data(['Out of bed with lights on', 'Out of bed with lights off', 'Awake in bed with lights on', 'Awake in bed with lights off', 'Sleep with lights on', 'Sleep with lights off'])
                .join('text')
                .attr('class', 'legendtext')
                .attr('x', legendSize + 5)
                .attr('y', (d, i) => legendSize-5 + i*(legendSize+5))
                .attr('font-size', '12px')
                .text(d => d)
        } else {
            svg.selectAll('rect')
                .data([1])
                .join('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', innerHeight + 15)
                .attr('width', innerWidth)
                .attr('fill', 'white')

            svg.selectAll('text')
                .data([1])
                .join('text')
                .text('')
        }
    }, [data, innerHeight, innerWidth, epsilon, height, width, color, selectedSequence, dataFilter, filterMasks, selectedCluster, copy, setFilterMasks, clearSelection])

    return (
        <div>
            <svg className = 'icicle' width={width} height={height} ref={svgIcicle}>
                <defs>
                    <clipPath id='icicle'>
                        <rect x={0} y={0} width={innerWidth} height={height + 15} />
                    </clipPath>
                </defs>
                <g className='content' clipPath='url(#icicle)' />
                <g className='yAxisCluster' />
            </svg>
            <div className={classes.root}>
                <Grid
                    container
                    className={classes.grid}
                    justify="space-evenly"
                    alignItems="flex-start"
                >
                    <Button
                        variant='outlined'
                        onClick={clearSelection}
                    >
                        Clear Selection
                    </Button>
                </Grid>

            </div>
        </div>
    )
}

export default Icicle