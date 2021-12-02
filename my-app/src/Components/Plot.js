import React from 'react'
import PCP from './PCP';
import NewScatter from './NewScatter';
import * as d3 from 'd3';

// Function to get the average value for each key in keys for each individual
const getIndividualData = (data, groupBy) => {
    let grouped = d3.rollups(data, v => {
        return {
            ac: d3.mean(v, d => (d['ac'])),
            client_id: d3.mean(v, d => (d['client_id'])),
            dist: d3.median(v, d => (d['dist'])),
            lights_off_clus: new Date(d3.mean(v, d => (d['lights_off_clus']))),
            lights_on_clus: new Date(d3.mean(v, d => (d['lights_on_clus']))),
            l_se: d3.mean(v, d => (d['l_se'])),
            l_sit: d3.mean(v, d => (d['l_sit'])),
            l_tst: d3.mean(v, d => (d['l_tst'])),
            l_taib: d3.mean(v, d => (d['l_taib'])),
            l_tib: d3.mean(v, d => (d['l_tib'])),
            l_oob: d3.mean(v, d => (d['l_oob'])),
            oobc: d3.mean(v, d => (d['oobc'])),
            sc: d3.mean(v, d => (d['sc'])),
            se: d3.mean(v, d => (d['se'])),
            sol: d3.mean(v, d => (d['sol'])),
            quality: d3.mean(v, d => (d['quality'])),
            iwib: d3.mean(v, d => (d['iwib'])),
            sit: d3.mean(v, d => (d['sit'])),
            tst: d3.mean(v, d => (d['tst'])),
            twso: d3.mean(v, d => (d['twso'])),
            tib: d3.mean(v, d => (d['tib'])),
            taib: d3.mean(v, d => (d['taib'])),
            waso: d3.mean(v, d => (d['waso'])),
            rested: d3.mean(v, d => (d['rested'])), 
            cluster: d3.median(v, d => (d['cluster'])),
        }
    }, d => d[groupBy] );

    let individualData = grouped.map(d => {
        return d[1]
    });
    
    return individualData;
};

const Plot = (props) => {
    const plot = props.plot;
    const copy = props.data;
    const dataFilter = props.dataFilter;
    const data = (props.data).filter(d => {return (dataFilter.includes(d.id))});


    const individualData = data.length > 0 ? getIndividualData(data, 'client_id') : [];
    const clusterData = data.length > 0 ? getIndividualData(data, 'cluster') : [];
         
    if (plot === 'pcp') {
        return (
            <PCP 
                data={data} 
                copy={copy}
                width={props.width}  
                height={props.height} 
                keys={props.keys}
                individualData={individualData}
                clusterData={clusterData}
                groupLevel={props.groupLevel}
                filterMasks={props.filterMasks}
                setFilterMasks={props.setFilterMasks}
                hovered={props.hovered}
                onHovered={props.onHovered}
                epsilon={props.epsilon}
                whiteList={props.whiteList}
            />
        )
    } else {
        return (
            <NewScatter
                data={data}
                copy={copy}
                width={props.width}
                height={props.height}
                keys={props.keys}
                individualData={individualData}
                clusterData={clusterData}
                groupLevel={props.groupLevel}
                filterMasks={props.filterMasks}
                setFilterMasks={props.setFilterMasks}
                hovered={props.hovered}
                onHovered={props.onHovered}
                whiteList={props.whiteList}
            />
        )
    }
};

export default Plot;