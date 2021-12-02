import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { axisBottom, axisLeft, select } from 'd3';

const padding = 0;

const margins = Object.freeze({
    top: 10, 
    right: 20, 
    bottom: 90, 
    left: 60
}); 

const margins2 = Object.freeze({
    top: 110, 
    right: 20, 
    bottom: 20, 
    left: 60
}); 

const Aggregation = (props) => {
    const width = props.width;
    const height = props.height;
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const dataFilter = props.dataFilter;
    const copy = props.data;
    const onBrushTime = props.onBrushTime;
    const hovered = props.hovered;
    const onHovered = props.onHovered;
    const alignment = props.alignment;
    const grouping = props.grouping;
    const includeNoise = props.includeNoise;

    let data = (props.data).filter(d => {
        if (hovered === 0) {
            return dataFilter.includes(d.id)
        } else {
            return d.id === hovered
        } 
    });

    const innerHeight = height - margins.top - margins.bottom;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight2 = height - margins2.top - margins2.bottom;

    const svgAggregation = useRef();
    const [currentZoomstate, setCurrentZoomState] = useState();
    const [minX, setMinX] = useState(0);
    const [maxX, setMaxX] = useState(0);

    // Function to check if two time ranges overlap
    const dateRangeOverlaps = (state_start, state_end, brush_start, brush_end) => {
        if (state_start <= brush_start && brush_start <= state_end) return true; // b starts in a
        if (state_start <= brush_end   && brush_end   <= state_end) return true; // b ends in a
        if (brush_start <= state_start && state_end   <= brush_end) return true; // a in b
        return false;
    };

    // Function to calculate the filtermask for the Aggregation component
    const calculateAggregationMask = (data, selected) => {
        return data.map(d => {
            return {
                id: d.id,
                value: selected.length === 0 ? true : selected.includes(d)
            }
        })
    };

    // Function to count the unique number of elements
    const count = function(ary, classifier) {
        return ary.reduce(function(counter, item) {
            var p = (classifier || String)(item);
            counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
            return counter;
        }, {})
    };

    // Create color scale
    const color = d3.scaleOrdinal()
    .domain(['outOfBed_on', 'outOfBed_off', 'awakeInBed_on', 'awakeInBed_off', 'sleep_on', 'sleep_off'])
    .range(['#b2df8a', '#33a02c', '#fdbf6f', '#ff7f00', '#a6cee3', '#1f78b4']); 

    useEffect(() => {
        const svg = select(svgAggregation.current)
        const content = svg.select('.content').attr('transform', `translate(${margins.left}, ${margins.top})`);

        if (data.length > 0) {
            if(includeNoise === 'exclude') {
                data = data.filter(d => d.cluster !== 'N')
            }

            if (grouping === 'date') {
                data.sort((a,b) => (a.lights_off - b.lights_off))
            } else {
                data.sort((a,b) => (b.client_id - a.client_id))
            };       

            // Group by cluster, then by states array and get the # of occurence for each unique sequence
            const grouped = d3.rollups(data, v => v.length, d => d.cluster, d => d.states_array.toString());

            // // Get all the clusters [0,1,2,3...]
            const layer1 = content.selectAll('.layer1').data([1]).join('g').attr('class', 'layer1')
            const layer2 = content.selectAll('.layer2').data([1]).join('g').attr('class', 'layer2')

            // Set the minimum and maximum domain values of the x scale
            // Check alignment to see if we align by date or by time
            const minTime = d3.min([d3.min(data, d => {return d3.min(d.states, s => {return alignment === 'relative' ? s.start_clus : s.start})}), d3.min(data, d => alignment === 'relative' ? d.lights_off_clus : d.lights_off)]);
            const maxTime = d3.max([d3.max(data, d => {return d3.max(d.states, s => {return alignment === 'relative' ? s.end_clus : s.end})}), d3.max(data, d => alignment === 'relative' ? d.lights_on_clus : d.lights_on)]);

            // Define the focus x axis scale
            const x = d3.scaleTime()
                .domain(minX === 0 ? [minTime, maxTime] : [minX, maxX])
                .range([padding, innerWidth-padding])

            // Define the context x axis scale
            const x2 = d3.scaleTime()
                .domain([minTime, maxTime])
                .range([padding, innerWidth-padding])

            // Define new x axis of the focus when zooming
            if(currentZoomstate) {
                const newX = currentZoomstate.rescaleX(x);
                x.domain(newX.domain());
            };

            // Define y axis scale for the clusters
            const yc = d3.scaleBand()
                .domain(data.map(d => d.cluster))
                .range([innerHeight, 0])
                .padding(0.1);                         // Padding between the clusters

            // For each cluster, you create a scaleband which is stored in y
            let y = {};
            let clientCount = [];
            let nightHeight = {};
            let swimLanes = [];

            for (let i = 0; i<grouped.length; i++) {
                let name = grouped[i][0]
                let start = 0;
                y[name] = d3.scaleBand()
                    .domain((data.filter(d => d.cluster === name)).map(d => alignment === 'relative' ? d.id : d.client_id))
                    .range([yc.bandwidth(), 0])
                    .padding(0)
                
                nightHeight[name] = y[name].bandwidth()

                if (alignment === 'relative') {
                    clientCount[name] = count((data.filter(d => d.cluster === name)), d => grouping === 'client' ? d.client_id : d.date)

                    const unique = ([...new Set((data.filter(d => d.cluster === name)).map(d => grouping === 'client' ? d.client_id : d.date))]).sort((a,b) => (b-a))

                    clientCount.map((d,i) => {
                        if (name === i) {
                            Object.entries(d).forEach(([key,value]) => {
                                for (let j=0; j< unique.length; j++) {
                                    const k = grouping === 'client' ? +key : key;
                                    if (k === unique[j]) {
                                        const obj = {
                                            client_id: k,
                                            cluster: name,
                                            count: value, 
                                            height: y[name].bandwidth(), 
                                            startY: start
                                        }
                                        swimLanes.push(obj)
                                        start = start + (value * y[name].bandwidth())
                                    }
                                }
                            })  
                        }
                        return null;
                    });
                };

                // Add bandwidth as height for each state
                data.map(d => {
                    if (d.cluster === name) {
                        d.height = y[name].bandwidth()
                        d.states.map(s => 
                            s.height = y[name].bandwidth())
                    }
                    return d;
                });
            };
          
            // Create the x axis of focus
            const xAxis = (svg) => svg
                .call(axisBottom(x)
                    .tickFormat(d3.timeFormat('%H:%M'))
                    .tickSizeInner(-innerHeight))

            // Create the x axis of context
            const xAxis2 = (svg) => svg
                .call(axisBottom(x2)
                    .tickFormat(alignment === 'relative' ? d3.timeFormat('%H:%M') : d3.timeFormat("%b %d"))
                    .tickSizeInner(-innerHeight2/15))
        
            // Add the x axis and rotate the ticks labels of focus
            svg.select('g.xAxis')
                .call(xAxis)
                .attr('transform', `translate(${margins.left}, ${innerHeight+margins.top})`)
                .selectAll('text')
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr('transform', 'rotate(-65)')

            // Add the x axis and rotate the ticks labels of context
            svg.select('g.xAxis2')
                .call(xAxis2)
                .attr('transform', `translate(${margins2.left}, ${innerHeight2 + margins.bottom})`)
                .selectAll('text')
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr('transform', 'rotate(-65)')

            // Change the style of the vertical ticks
            svg.selectAll('g.xAxis .tick line')
                .attr('stroke', 'grey')
                .style('stroke-opacity', 0.5)
                .attr('stroke-dasharray', '2,2')
            
            // Create the y axis
            const yAxisCluster = (svg) => svg
                .call(axisLeft(yc)
                    .tickSizeOuter(0)
                    .tickSizeOuter(0));

            // Add the y axis for the clusters
            svg.select('g.yAxisCluster')
                .call(yAxisCluster)
                .attr('transform', `translate(${margins.left}, ${margins.top})`)
                .select('.domain')
                    .attr('stroke-width', 0)

            svg.select('g.yAxisCluster')
                .selectAll('.tick')
                    .selectAll('line')
                        .remove()

            // Add title to the y axis
            svg.selectAll('.yTitle')
                .data(['Cluster'])
                .join('text')
                .attr('class', 'yTitle')
                .style('text-anchor', 'end')
                .attr('x', - innerHeight/2)
                .attr('y', margins.left/2-5)
                .attr('transform', 'rotate(-90)')
                .text(d => d)

            svg.selectAll('.title').remove()

            // Create the swimlanes
            const clientRect = layer1.selectAll('.clientRect')
                .data(swimLanes)
                .join('rect')
                .attr('class', 'clientRect')
                .attr('x', 0)
                .attr('y', d => yc(d.cluster) + d.startY)
                .attr('width', innerWidth)
                .attr('height', d => (d.count * d.height))
                .attr('fill', (d,i) => i%2 ? 'grey' : 'black')
                .attr('opacity', 0.15)
                .append('title')
                .attr('class', 'title')
                .text(d => grouping === 'client' ? 'Subject ID: ' + d.client_id : 'Date: ' + d.client_id)
         
            // Create g element for every night
            let nights = layer2
                .selectAll('.night')
                .data(data, d => d.states)
                .join('g')
                .attr('class', 'night')
                .attr('transform', d => alignment === 'relative' ? `translate(0, ${yc(d.cluster) + y[d.cluster](d.id)})` : `translate(0, ${yc(d.cluster) + y[d.cluster](d.client_id)})` )
                .style('cursor', 'pointer')
                .on('click', (e,d) => onHovered(d.id === hovered ? 0 : d.id))

            // Create rect element for every state
            const night = nights.selectAll('.rect')
                .data(d => d.states)
                .join('rect')
                .attr('class', 'rect')
                .attr('x', d => alignment === 'relative' ? x(d.start_clus) : x(d.start))
                .attr('y', 0)
                .attr('width', d => alignment === 'relative' ? x(d.end_clus)-x(d.start_clus) < 0 ? 0 : x(d.end_clus)-x(d.start_clus) :x(d.end)-x(d.start) < 0 ? 0 : x(d.end)-x(d.start)) //No negative width
                .attr('height', d => d.height)
                .attr('fill', d => color(d.state)) 

            // Add tooltip text
            night.selectAll('.nightTitle')
                .data(d => [['Subject ID: ' + d.client_id + ', State: ' + d.state + ': ' + d.start + ' - ' + d.end]])
                .join("title")
                .attr('class', 'nightTitle')
                .text((d,e) => d )

             // Function to handle the brush
             const brushed = ({selection}) => {
                if (selection === null) {
                    setMinX(0)
                    setMaxX(0)
                    onBrushTime([0,0])

                    // If the selection is removed, select all nights again
                    setFilterMasks({...filterMasks, 'aggregation': calculateAggregationMask(copy, copy)})
                } else {
                    const timeSelection = selection.map(x2.invert)
                    setMinX(timeSelection[0])
                    setMaxX(timeSelection[1])
                    onBrushTime(timeSelection)

                    // Sets inBrush to true if one of the states overlaps with the selected time range
                    copy.map(d => d.inBrush = alignment === 'relative' 
                        ? (d.states.map(s => dateRangeOverlaps(s.start_clus, s.end_clus, timeSelection[0], timeSelection[1])).includes(true)) 
                        : (d.states.map(s => dateRangeOverlaps(s.start, s.end, timeSelection[0], timeSelection[1])).includes(true)) )

                    // Contains all nights where inBrush is true
                    const selected = copy.filter(d => d.inBrush === true)

                    // Only show the nights that are selected in the other views
                    setFilterMasks({...filterMasks, 'aggregation': calculateAggregationMask(copy, selected)})
                }
            };

            // Brush
            const brush = d3.brushX(x2)
                .extent([[0, -innerHeight2/10], [innerWidth, 0]])
                .on('end', brushed);

            svg.selectAll('.xAxis2')
                .data([0])
                .join('g')
                .call(brush)
            
        } else {
            content.selectAll('rect').remove()
        }
    }, [data, innerHeight, innerWidth, currentZoomstate, width, hovered, copy, filterMasks, innerHeight2, maxX, minX, onBrushTime, onHovered, setFilterMasks, alignment])
    
    return (
        <div>
            <svg className = 'aggregation' width={width} height={height} ref={svgAggregation}>
                <defs>
                    <clipPath id='aggregation'>
                        <rect x={0} y={0} width={innerWidth} height={innerHeight} />
                    </clipPath>
                </defs>
                <g className='content' clipPath='url(#aggregation)' />
                <g className='xAxis' />
                <g className='yAxisCluster' />
                <g className='xAxis2' />
            </svg>
        </div>
    )
}

export default Aggregation;