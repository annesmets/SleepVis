// Import libraries
import React,{ useEffect, useState } from 'react';
import * as d3 from 'd3'
import AutoSizer from "react-virtualized-auto-sizer";
import { reduce, mapValues } from 'lodash';

// Import Components
import './App.css'
import Calendar from './Components/Calendar';
import Aggregation from './Components/Aggregation';
import RadioButtons from './Components/RadioButtons';
import Icicle from './Components/Icicle';
import Map from './Components/Map';
import Plot from './Components/Plot';
import Alignment from './Components/Alignment';
import ClientSelection from './Components/ClientSelection';
import ClusterFunction from './Components/ClusterFunction';
import EpsilonSlider from './Components/EpsilonSlider';
import PlotOption from './Components/PlotOption';
import TagifyInput from './Components/TagifyInput';

const App = () => {
  // Get data
  const url = 'https://gist.githubusercontent.com/annesmets/a6800e8518d655a091f2d8a5c5036a59/raw/6073957ff2087be517842e0109afbfdd32751e44/sleepvis_example.json'
    
  const [data, setData] = useState([]);                                     //Data
  const [filterMasks, setFilterMasks] = useState({});                       //The mask that contains all filters
  const [plotAverage, setPlotAverage] = useState('night'); 
  const [mapAverage, setMapAverage] = useState('night'); 
  const [epsilon, setEpsilon] = useState(3)                                 //Epsilon -> parameter of DBSCAN
  const [keys, setKeys] = useState([]);                                     //The axes of the PCP
  const [mapColor, setMapColor] = useState('ac')                            //The color on the map
  const [plot, setPlot] = useState('pcp')                                   //To choose between pcp and scatter
  const [hovered, setHovered] = useState(0);
  const [year, setYear] = useState(2021);
  const [brushTime, setBrushTime] = useState([0,0]);
  const [alignment, setAlignment] = useState('relative');
  const [client, setClient] = useState([]);
  const [grouping, setGrouping] = useState('client');
  const [includeNoise, setIncludeNoise] = useState('exclude');

  // Options in the dropdown menu
  const whiteList = [
    {value:'lights_off_clus', name:'Lights off'},
    {value:'lights_on_clus', name:'Lights on'},
    {value:'l_se', name:'Local sleep efficiency'},
    {value:'l_sit', name:'Local sleep intention time'},
    {value:'l_tst', name:'Local sleep time'},
    {value:'l_taib', name:'Local time awake in bed'},
    {value:'l_tib', name:'Local time in bed'},
    {value:'l_oob', name:'Local time out of bed'},
    {value:'ac', name:'Number of awakenings'},
    {value:'sc', name:'Number of sleep episodes'},
    {value:'oobc', name:'Number of times out of bed'},
    {value:'se', name:'Sleep efficiency'},
    {value:'sol', name:'Sleep onset latency'},
    {value:'quality', name:'Sleep quality'},
    {value: 'twso', name:'Terminal wake time'},
    {value:'iwib', name:'Total intended wake in bed time'},
    {value:'sit', name:'Total sleep intention time'},
    {value:'tst', name:'Total sleep time'},
    {value:'taib', name:'Total time awake in bed'},
    {value:'tib', name:'Total time in bed'},
    {value:'waso', name:'Wake after sleep onset'},
    {value:'rested', name:'Well rested'}
  ];

  // Load the JSON data
  useEffect(() => {
      d3.json(url).then(setData);
  },[]);


  // Transform date into correct format
  function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
  };

  // Function to calculate distance between 2 lat lon pairs
  const distance = (lat1, lon1, lat2, lon2) => {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
    
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  };

  // Function to check if two time ranges overlap
  const dateRangeOverlaps = (state_start, state_end, brush_start, brush_end) => {
    if (state_start <= brush_start && brush_start <= state_end) return true; // b starts in a
    if (state_start <= brush_end   && brush_end   <= state_end) return true; // b ends in a
    if (brush_start <= state_start && state_end   <= brush_end) return true; // a in b
    return false;
  };

  const minTime = (time1, time2) => {
    let mintime;
    time1 <= time2  
      ? mintime = time1
      : mintime = time2
    
    return mintime;
  };

  const maxTime = (time1, time2) => {
    let maxtime;
    time1 >= time2  
      ? maxtime = time1
      : maxtime = time2
    
    return maxtime;
  };

  // Convert data
  data.map(d => {
    return(
      // Total duration
        d.tib = 0,      //Total time in bed
        d.tst = 0,      //Total sleep time
        d.taib = 0,     //Total time awake in bed
        d.oob = 0,      //Total time out of bed
        d.sit = 0,      //Total sleep intention time
        d.waso = 0,     //Wake after sleep onset
      // Latency
        d.sol = 0,      //Sleep onset latency
      // Fragmention
        d.l_tst = 0,    //Local sleep time
        d.l_tib = 0,    //Local time in bed
        d.l_taib = 0,   //Local time awake in bed
        d.l_oob = 0,    //Local time out of bed
      // Other
        d.se = 0,       //Sleep efficiency
        d.sc = 0,       //Sleep count
        d.ac = 0,       //Awake count
        d.oobc = 0,
        d.iwib = 0,     //Total intended wake in bed time,
        d.twso = 0,     //Terminal wake time 
        d.Latitude_zip = +d.Latitude,
        d.Longitude_zip = +d.Longitude,
        d.zip = +d.zip,
        d.dist = d.zip === 0 ? 0 : distance(51.44873543911078, 5.374131755515852, d.Latitude_zip, d.Longitude_zip),
        d.client_id = +d.patient_id,
        d.id = +d.id,
        d.lights_off = new Date(d.lights_off),
        d.lights_on = new Date(d.lights_on),
        d.lights_off_clus = d.lights_on.getDate() !== d.lights_off.getDate() 
          ? new Date(2020, 1, 1, d.lights_off.getHours(), d.lights_off.getMinutes())
          : new Date(2020, 1, 2, d.lights_off.getHours(), d.lights_off.getMinutes()),
        d.lights_on_clus = new Date(2020, 1, 2, d.lights_on.getHours(), d.lights_on.getMinutes()),
        d.month = (d.lights_on).getMonth() + 1,
        d.date = formatDate(d.lights_on),
        d.year = (d.lights_on).getFullYear(),
        d.quality = +d.quality,
        d.rested = +d.rested,
        d.states_array = [],
        d.sit = Math.floor((d.lights_on - d.lights_off) / (1000*60)),     //Sleep intention time in minutes

        // If no brush, local sleep intention time is equal to total sleep intention time (all selected)
        // If brush and brush outside lights off and on, local sleep intention time is 0
        brushTime[0] === 0
          ? d.l_sit = d.sit
          : (brushTime[1] < d.lights_off_clus || d.lights_on_clus < brushTime[0]
            ? d.l_sit = 0
            : d.l_sit = Math.floor((minTime(d.lights_on_clus, brushTime[1]) - maxTime(d.lights_off_clus, brushTime[0])) / (1000*60))),  
        
        d.prev =
        d.states.map(s => {
          s.client_id = d.client_id
          d.states_array.push(s.state) 
          s.start = new Date(s.start)
          s.end = new Date(s.end)
            if (s.state === 'sleep_on' || s.state === 'sleep_off') {
                d.tst = d.tst + Math.floor((s.end - s.start) / (1000*60));
                d.fa = s.end;
                d.sc = d.sc + 1;
                if (d.sc === 1) {
                    d.so = s.start;                                                         //Sleep onset (start time of the first time asleep)
                    d.sol = Math.abs(Math.floor((s.start - d.lights_off) / (1000*60)));     //Sleep onset latency (time between lights off and first time asleep)
                }
                // If no brush, local sleeping time is equal to total sleeping time (all selected)
                // If brush and state overlaps with range, calculate the local sleeping time
                brushTime[0] === 0 
                  ? d.l_tst = d.tst
                  : (dateRangeOverlaps(s.start_clus, s.end_clus, brushTime[0], brushTime[1]) 
                    ? d.l_tst = d.l_tst + Math.floor((minTime(s.end_clus, brushTime[1]) - maxTime(s.start_clus, brushTime[0])) / (1000*60))
                    : d.l_tst = d.l_tst + 0)
            }
            if (s.state === 'awakeInBed_off') {
                d.taib = d.taib + Math.abs(Math.floor((s.end - s.start) / (1000*60)));      //Time awake in bed
                d.ac = d.sc > 0 && d.prev !== 'awakeInBed_off' && d.prev !== 'outOfBed_off' ? d.ac + 1 : d.ac;
                // If no brush, local time awake in bed is equal to total time awake in bed (all selected)
                // If brush and state overlaps with range, calculate the local time awake in bed
                brushTime[0] === 0 
                  ? d.l_taib = d.taib
                  : (dateRangeOverlaps(s.start_clus, s.end_clus, brushTime[0], brushTime[1]) 
                    ? d.l_taib = d.l_taib + Math.floor((minTime(s.end_clus, brushTime[1]) - maxTime(s.start_clus, brushTime[0])) / (1000*60))
                    : d.l_taib = d.l_taib + 0)
            }
            if (s.state === 'awakeInBed_on') {
              d.iwib = d.iwib + Math.abs(Math.floor((s.end - s.start) / (1000*60)));
            }
            if (s.state === 'outOfBed_off') {
              d.oob = d.oob + Math.abs(Math.floor((s.end - s.start) / (1000*60)));
              d.ac = d.sc > 0 && d.prev !== 'awakeInBed_off' && d.prev !== 'outOfBed_off' ? d.ac + 1 : d.ac;
              d.oobc = d.prev !== 'outOfBed_off' ? d.oobc + 1 : d.oobc;
              // If no brush, local time awake in bed is equal to total time awake in bed (all selected)
              // If brush and state overlaps with range, calculate the local time awake in bed
              brushTime[0] === 0 
                ? d.l_oob = d.oob
                : (dateRangeOverlaps(s.start_clus, s.end_clus, brushTime[0], brushTime[1]) 
                  ? d.l_oob = d.l_oob + Math.floor((minTime(s.end_clus, brushTime[1]) - maxTime(s.start_clus, brushTime[0])) / (1000*60))
                  : d.l_oob = d.l_oob + 0)
            }
            s.start_clus = d.lights_on.getDate() !== s.start.getDate() 
              ? s.start_clus = new Date(2020, 1, 1, s.start.getHours(), s.start.getMinutes()) 
              : s.start_clus = new Date(2020, 1, 2, s.start.getHours(), s.start.getMinutes())
            s.end_clus = d.lights_on.getDate() !== s.end.getDate()
              ? s.end_clus = new Date(2020, 1, 1, s.end.getHours(), s.end.getMinutes())
              : s.end_clus = new Date(2020, 1, 2, s.end.getHours(), s.end.getMinutes())
            d.prev = s.state
          return s;
        }),
        d.tib = d.tst + d.taib,
        d.l_tib = d.l_tst + d.l_taib,
        d.waso = d.tst === 0 ? 0 : (Math.floor((d.fa - d.so) / (1000*60)) - d.tst),                //WASO = time awake between first time asleep and final awakening
        d.tasafa = d.tst === 0 ? 0 : Math.abs(Math.floor((d.fa - d.lights_on) / (1000*60))),
        d.dse = d.tst === 0 ? 0 : d.sol + d.tst + d.waso + d.tasafa,
        d.se = d.tst === 0 ? 0 : (d.tst / d.sit),
        d.l_se = d.l_tst === 0 ? 0 : (d.l_tst / d.l_sit),
        d.twso = d.tst === 0 ? 0 : - Math.floor((d.fa - d.lights_on) / (1000*60))
    )});

  console.log(data)

  // Function that returns true if year is equal to selected year in calendar
  const calculateYearMask = (data, selected) => {
    return data.map(d => {
      return {
          id: d.id,
          value: selected.includes(d)
      }
    }) 
  };

  // Filtermask that returns true if year is equal to selected year in calendar 
  // And client_id is included in client array
  useEffect(() => {
    if (Object.keys(filterMasks).length < 2) {
      setFilterMasks({...filterMasks, 'year': calculateYearMask(data, [])})
    } else {
      const selected =  data.filter(d => d.year === year)
      
      // Set the selected nights to true in the filter masks
      setFilterMasks({...filterMasks, 'year': calculateYearMask(data, selected)})
    }
  }, [year, data, client]);


  // console.log(filterMasks)
  // Function to get the intersection of the filtermasks
  const combineMasks = (masks, component) => {
    // Get the id's returned by all other components, except the component you're in. 
    //(the filter mask of calendar should not affect the calendar data)
    const { [component]: _, ...newMasks } = masks
    const maskValues = Object.values(newMasks);

    const reducedMask = reduce (
      maskValues,                                                   //The collection to iterate over
      (result, mask) => {                                           //The function for each iteration
        return mapValues(
          mask,                                                     //The object to iterate over
          (value, subjectId) => { 
            return result[subjectId] && (result[subjectId].value === false ? false : value)});        //The function for each iteration
      },
      mapValues(maskValues[0], () => true)                          //The initial value
    );

    // The selected nights are the ones where the value is true.
    // Push ids of the selected nights to an array and return it
    let ids = []

    for (let reduced in reducedMask) {
      if (reducedMask[reduced].value === true) {
        ids.push(reducedMask[reduced].id)
      }
    };

    return ids;
  };

  // Get all ids of nights for each component
  const aggregationFilter = combineMasks(filterMasks, ['aggregation']);
  const calendarFilter = combineMasks(filterMasks, ['calendar']);
  const pcpFilter = combineMasks(filterMasks, ['pcp']);
  const icicleFilter = combineMasks(filterMasks, ['icicle']);
  const mapFilter = combineMasks(filterMasks, ['map']);
  const clusterFilter = combineMasks(filterMasks, ['icicle'])
  const clientFilter = combineMasks(filterMasks, ['client'])

  return(
      <div className="flexbox-container">
        {/* Cluster the data */}
        <ClusterFunction
          data={data}
          epsilon={epsilon}
          clusterFilter={clusterFilter}
        />

      {/* Visualization content */}
      <div className='flexbox-vis-container'>  

        {/* Second column */}
        <div className='flexbox-column-2'>

          {/* Client selection */}
          <div className='flexbox-item flexbox-item-plot'>
            <ClientSelection 
              onClientSelected={(client) => setClient(client)}
              client={client}
              data={data}
              dataFilter={clientFilter}
              filterMasks={filterMasks}
              setFilterMasks={setFilterMasks}
              year={year}
              onIncludeNoiseSelected = {(includeNoise) => setIncludeNoise(includeNoise)}
              includeNoise={includeNoise}
            />
          </div> 

          {/* Option to choose PCP or scatterplot */}
          <div className='flexbox-item flexbox-item-plot'>
              <PlotOption
                plot={plot}
                onPlotSelected={(plot) => setPlot(plot)}
                keys={keys}
                plotAverage={plotAverage}
                onMapAverageSelected={(plotAverage) => setPlotAverage(plotAverage)}
              />
          </div>

          <div className='flexbox-item flexbox-item-plot-dropdown'>
            <TagifyInput 
              onKeysSelected={(keys) => setKeys(keys)}
              whiteList={whiteList}
            />
          </div>
    
          {/* Plot */}
          <div className='flexbox-item flexbox-item-3'>
            <AutoSizer>
              {({ width, height }) => 
                <Plot
                  width={width}  
                  height={height} 
                  keys={keys}
                  epsilon={epsilon}
                  groupLevel={plotAverage}
                  dataFilter={pcpFilter}
                  data={data} 
                  filterMasks={filterMasks}
                  setFilterMasks={setFilterMasks}
                  plot={plot}
                  onHovered={(hovered) => setHovered(hovered)}
                  hovered={hovered}
                  whiteList={whiteList}
                />
              }
            </AutoSizer>
          </div>

          {/* Radio buttons */}
          <div className='flexbox-item flexbox-item-radio'>
              <RadioButtons
                groupLevel={mapAverage}
                mapColor={mapColor}
                onMapAverageSelected={(mapAverage) => setMapAverage(mapAverage)}
                onMapColorSelected={(mapColor) => setMapColor(mapColor)}
              />
          </div>

          {/* Map */}
          <div className='flexbox-item flexbox-item-3'>
              <Map
                dataFilter={mapFilter}
                data={data}
                groupLevel={mapAverage} 
                filterMasks={filterMasks}    
                setFilterMasks={setFilterMasks} 
                mapColor={mapColor}  
                onHoverSelected={(hovered) => setHovered(hovered)}
                hovered={hovered}
              />
          </div>
        </div>

        {/* Third column */}
        <div className='flexbox-column-3'>

          {/* Calendar */}
          <div className='flexbox-item flexbox-item-6'>
            <AutoSizer>
              {({ width, height }) => 
                <Calendar
                  width={width}
                  height={height} 
                  filterMasks={filterMasks}
                  setFilterMasks={setFilterMasks}
                  dataFilter={calendarFilter}
                  data={data}
                  year={year}
                  onYearSelected={(year) => setYear(year)}
                />
              }
            </AutoSizer>
          </div>

          <div className='flexbox-item flexbox-item-epsilon'>
              <EpsilonSlider
                onEpsilonSelected={(epsilon) => setEpsilon(epsilon)}
                epsilon={epsilon} 
                groupLevel={plotAverage}
              />
          </div>

          {/* Icicle plot */}
          <div className='flexbox-item flexbox-item-icicle'>
            <AutoSizer>
              {({ width, height }) => 
                <Icicle 
                  width={width} 
                  height={height}
                  filterMasks={filterMasks}
                  setFilterMasks={setFilterMasks}
                  epsilon={epsilon} 
                  dataFilter={icicleFilter}
                  data={data} 
                  includeNoise={includeNoise}
                />
              }
            </AutoSizer>
          </div>

          {/* Option to change the alignment in the aggregation */}
          <div className='flexbox-item flexbox-item-alignment'>
            <Alignment 
              alignment={alignment}
              onAlignmentSelected={(alignment) => setAlignment(alignment)}
              grouping={grouping}
              onGroupingSelected={(grouping) => setGrouping(grouping)}
            />
          </div>

          {/* Aggregated timeline */}
          <div className='flexbox-item flexbox-item-4'>
            <AutoSizer>
              {({ width, height }) => 
                <Aggregation 
                  width={width} 
                  height={height}
                  epsilon={epsilon} 
                  data={data} 
                  dataFilter={aggregationFilter}
                  filterMasks={filterMasks}
                  setFilterMasks={setFilterMasks}
                  brushTime={brushTime}
                  onBrushTime={(brushTime) => setBrushTime(brushTime)}
                  onHovered={(hovered) => setHovered(hovered)}
                  hovered={hovered}
                  alignment={alignment}
                  client={client}
                  grouping={grouping}
                  includeNoise={includeNoise}
                />
              }
            </AutoSizer>
          </div>
        </div>
      </div>
      </div>
  );
};

export default App;