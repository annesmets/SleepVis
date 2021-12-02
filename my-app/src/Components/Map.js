import React, { useEffect, useState } from 'react';
import { LayerGroup, MapContainer, Pane, Rectangle, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import "leaflet-area-select";
import * as d3 from 'd3';
import Legend from './Legend'

// To fix the marker icon (otherwise not available)
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

// Function to get the most frequent location for each individual
const getIndividualData = (data, groupBy, mapColor) => {
    // Group the data per client or cluster and get array with zip codes from most frequent to least frequent
    let grouped = d3.groups(
        data, 
        d => d[groupBy],
        d => d.zip
    )
        .sort(([_a,a], [_b,b]) => d3.descending(a.length, b.length))    // (a,b) are each client's zip array
        .map(([_o, obj]) => [
            _o,
            obj.sort(([_a,a], [_b,b]) => d3.descending(a.length, b.length))
        ])


    if (groupBy === 'client_id') {
        return grouped.map(d => {
            return { 
                client_id: d[0],
                // If the zip code is 0, then check if there's a next most frequent zip code
                // If there is, take it, else set zip equal to 0
                mapcolor: d3.mean(data.filter(s => s.client_id === d[0]), s => s[mapColor]),
                zip: d[1][0][0] !== 0 ? d[1][0][0] : (d[1][1] ? d[1][1][0] : 0),
                Latitude_zip: d[1][0][0] !== 0 ? d[1][0][1][0].Latitude_zip : (d[1][1] ? d[1][1][1][0].Latitude_zip : 0),
                Longitude_zip: d[1][0][0] !== 0 ? d[1][0][1][0].Longitude_zip : (d[1][1] ? d[1][1][1][0].Longitude_zip : 0)
            }
        })
    } else if (groupBy === 'cluster') {
        return grouped.map(d => {
            return { 
                cluster: d[0],
                // If the zip code is 0, then check if there's a next most frequent zip code
                // If there is, take it, else set zip equal to 0
                mapcolor: d3.mean(data.filter(s => s.cluster === d[0]), s => s[mapColor]),
                zip: d[1][0][0] !== 0 ? d[1][0][0] : (d[1][1] ? d[1][1][0] : 0),
                Latitude_zip: d[1][0][0] !== 0 ? d[1][0][1][0].Latitude_zip : (d[1][1] ? d[1][1][1][0].Latitude_zip : 0),
                Longitude_zip: d[1][0][0] !== 0 ? d[1][0][1][0].Longitude_zip : (d[1][1] ? d[1][1][1][0].Longitude_zip : 0)
            }
        })
    }
};

// Check if the data point is inside the selected rectangle
const checkInRectangle = (lat0, lon0, lat1, lon1, d) => {
    if (d.Latitude_zip >= lat0 && d.Latitude_zip <= lat1 && d.Longitude_zip >= lon0 && d.Longitude_zip <= lon1) {
        return true;   
    } else {
        return false;
    }
};

const Map = (props) => {
    const mapColor = props.mapColor;
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const groupLevel = props.groupLevel;
    const dataFilter = props.dataFilter;
    const copy = props.data;
    const hovered = props.hovered;
    const data = (props.data).filter(d => {return (dataFilter.includes(d.id))});

    const [map, setMap] = useState(null);
    const center = [51.4381, 5.4752];
    const [areaBounds, setAreaBounds] = useState([[51.4381, 5.4752], [52.4381, 6.4752]]);
    const [opacity, setOpacity] = useState(0);
    const [fillOpacity, setFillOpacity] = useState(0);

    // Calculate the filter mask for the Calendar component
    const calculateMapMask = (selected, data) => {
        return data.map(d => {
            return {
                id: d.id,
                value: selected.length === 0 ? true : selected.includes(d)
            }
        })
    };  

    const areaSelected = (e) => {
        setAreaBounds(e.bounds)
        setOpacity(1)
        setFillOpacity(0)
    };

    const onClick = () => {
        setOpacity(0)
        setFillOpacity(0)
    };

    useEffect(() => {
        if(opacity === 1) {
            let lat0 = areaBounds._southWest.lat;
            let lon0 = areaBounds._southWest.lng;
            let lat1 = areaBounds._northEast.lat;
            let lon1 = areaBounds._northEast.lng;

            let selected;

            if (groupLevel === 'individual') {
                let selectedId = (individualData.filter(d => checkInRectangle(lat0, lon0, lat1, lon1, d))).map(d => d.client_id)
                selected = copy.filter(c => selectedId.includes(c.client_id))
            } else if (groupLevel === 'cluster') {
                let selectedCluster = (clusterData.filter(d => checkInRectangle(lat0, lon0, lat1, lon1, d))).map(d => d.cluster)
                selected = copy.filter(c => selectedCluster.includes(c.cluster))
            } else {
                selected = data.filter(d => checkInRectangle(lat0, lon0, lat1, lon1, d))
            };

            setFilterMasks({...filterMasks, 'map': calculateMapMask(selected, copy)})

        } else {
            setFilterMasks({...filterMasks, 'map': calculateMapMask([], copy)})
        };

    }, [opacity])

    const individualData = getIndividualData(data, 'client_id', mapColor); 
    const clusterData = getIndividualData(data, 'cluster', mapColor)
    // let selectedArea;
    
    const D3Layer = () => {
        const mymap = useMap();
        mymap.boxZoom.disable();

        useEffect(() => { 
            // Initialize svg to add to mymap
            L.svg({clickable:true}).addTo(mymap);
            const overlay = d3.select(mymap.getPanes().overlayPane);
            const svg = overlay.selectAll('svg').data([1]).join('svg').attr("pointer-events", "none")

            const minValue = d3.min(data, d => d[mapColor])
            const maxValue = d3.max(data, d => d[mapColor])
            
            // Define color scale
            const color = d3.scaleSequential(d3.interpolateYlGn)
                .domain([minValue, maxValue])

            // console.log(data)

            if (data.length > 0) {
                // Add circle to the map
                const dots = svg.selectAll('circle')
                        .attr('class', 'dots')
                        .data(groupLevel === 'individual' ? individualData.filter(d => d.zip !== 0) : (groupLevel === 'cluster' ? clusterData.filter(d => d.zip !== 0) : data.filter(d => d.zip !== 0 && d.dist < 500)))
                        .join('circle')
                        .attr('cx', d => mymap.latLngToLayerPoint([d.Latitude_zip, d.Longitude_zip]).x)
                        .attr('cy', d => mymap.latLngToLayerPoint([d.Latitude_zip, d.Longitude_zip]).y)
                        .attr('r', 4)
                        .attr('stroke', d => hovered === d.id ? 'red' : 'black')
                        .attr('stroke-width', d => hovered === d.id ? 3 : 0.2)
                        .style('cursor', 'pointer')
                        .attr('fill', groupLevel === 'night' ? d => color(d[mapColor]): d => color(d['mapcolor']))
                    
                const update = () => dots
                    .attr('cx', d => mymap.latLngToLayerPoint([d.Latitude_zip, d.Longitude_zip]).x)
                    .attr('cy', d => mymap.latLngToLayerPoint([d.Latitude_zip, d.Longitude_zip]).y)

                mymap.on('zoomend', update)
            } else {
                svg.selectAll('circle').remove()
            };

        }, [])

        return null;
    }

    const AreaSelect = () => {   
        const mymap = useMap();
        mymap.boxZoom.disable();
    
        useEffect(() => {
            if (data.length > 0) {
                if(!mymap.selectArea) return;
                mymap.selectArea.enable();

                // Select area on the map
                mymap.once('areaselected', (e) => {
                    areaSelected(e);
                });
                
                // Set all selected when clicked on the map
                mymap.once('click', (e) => {
                    onClick();
                })
    
                // now switch it off
                mymap.selectArea.setValidate();

                return () => {
                    mymap.off('areaselected', areaSelected)
                    mymap.off('click', onClick)

                } 
            }   
        }, []);
        return null;
    }

    return (
        <MapContainer 
            center={center} 
            zoom={10} 
            whenCreated={setMap}
        >
            <TileLayer
                maxZoom={20}
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Legend map={map} />
            <LayerGroup>
                <D3Layer />
                <AreaSelect />
                <Pane name='area-rectangle' style={{ zIndex: 499 }}>
                    <Rectangle bounds={areaBounds} pathOptions={{ color: 'blue', opacity: opacity, fillOpacity: fillOpacity }}/>
                </Pane>
            </LayerGroup>
        </MapContainer> 
    );
};

export default Map;