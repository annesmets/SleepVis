import React, { useEffect, useState, useRef } from 'react';
import * as d3Base from 'd3';
import { legendColor } from 'd3-svg-legend'
import FormControl from '@material-ui/core/FormControl';
import { makeStyles } from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { Grid, MenuItem } from '@material-ui/core';

// attach all d3 plugins to the d3 library
const d3 = Object.assign(d3Base, { legendColor })

const margins = Object.freeze({
    top: 20, 
    right: 20, 
    bottom: 20, 
    left: 70
}); 

const arrayOfWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const arrayOfMonths =  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Calendar = (props) => {
    const width = props.width;
    const height = props.height;

    const selectedYear = props.year;
    const onYearSelected = props.onYearSelected;
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const dataFilter = props.dataFilter;
    const copy = props.data;
    const data = (props.data).filter(d => {return (dataFilter.includes(d.id))});

    const svgCalendar = useRef(); 

    const [selectedDate, setSelectedDate] = useState([]);               //Array containing dates selected in calendar   
    const [calendarColor, setCalendarColor] = useState('lights_off_clus');  
    const [buttonDisabled, setButtonDisabled] = useState(true);

    const maxYear = 2021;
    const minYear = 2020;
    const cellSize = width/62
    const legendSize = 16;

    const useStyles = makeStyles((theme) => ({
        formControl: {
          minWidth: 300,
        },
        root: {
            '& > *': {
              minWidth: 200
            },
            display: 'flex',
          },
        button: {
        },
        buttonGroup:{
            minWidth: 300,
        },
        grid: {
            marginRight: theme.spacing(15)
        }
      }));
  
    const classes = useStyles();

    // Calculate the filter mask for the Calendar component
    const calculateCalendarMask = (dateArray, data) => {
        return data.map(d => {
            return {
                id: d.id,
                value: dateArray.length === 0 ? true : dateArray.includes(d.date)
            }
        })
    };

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

    // Function to decrement the selected day
    const decrementDay = () => {
        let newDate = new Date(selectedDate);
        let newSelectedDate = new Date(newDate.setDate(newDate.getDate() - 1));

        const minId = [...data].reduce((min, d) => min < d.id ? min : d.id)
        let minDate;
        data.map(d => {
            if (d.id === minId) {
                minDate = d.date
            }
        })

        if (newDate >= new Date(minDate)) {
            while (data.filter(d => d.date === formatDate(newDate)).length === 0) {
                newDate = new Date(newDate.setDate(newDate.getDate() - 1))
                newSelectedDate = newDate
            }
        
            setSelectedDate([formatDate(newSelectedDate)])
            setFilterMasks({...filterMasks, 'calendar': calculateCalendarMask([formatDate(newSelectedDate)], copy)})
        };
    };

    // Function to increment the selected day
    const incrementDay = () => {
        let newDate = new Date(selectedDate);
        let newSelectedDate = new Date(newDate.setDate(newDate.getDate() + 1));

        const maxId = [...data].reduce((max, d) => d.id > max ? d.id : max)
        let maxDate;
        data.map(d => {
            if (d === maxId) {
                maxDate = d.date
            }
        })

        if (newDate <= new Date(maxDate)) {
            while (data.filter(d => d.date === formatDate(newDate)).length === 0) {
                newDate = new Date(newDate.setDate(newDate.getDate() + 1))
                newSelectedDate = newDate
            }
        
            setSelectedDate([formatDate(newSelectedDate)])
            setFilterMasks({...filterMasks, 'calendar': calculateCalendarMask([formatDate(newSelectedDate)], copy)})
        };
    };

    // Clear the selected days with the button
    const clearSelection = () => {
        setSelectedDate([]);
        setFilterMasks({...filterMasks, 'calendar': calculateCalendarMask([], copy)})
    };

    // Function to change the color in the calendar
    const changeCalendarColor = (e) => {
        setCalendarColor(e.target.value)
    };

    // Function to create the legend image
    function ramp(color, n = 512) {
        var canvas = document.createElement('canvas');
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(i, 0, 1, 1);
        }
        return canvas;
    };
    
    useEffect(() => {
        // Add selected day to array
        const changeDate = (selectedDates) => {
            if (selectedDate.length > 0) {
                // Check if dates array already includes the selected date.
                const intersection = selectedDates.filter(x => selectedDate.includes(x))

                // If the date is already in the date array, remove it from the array
                if (intersection.length > 0) {
                    let dateArray = selectedDate.filter(el => !intersection.includes(el));
                    setSelectedDate(dateArray);
                    setFilterMasks({...filterMasks, 'calendar': calculateCalendarMask(dateArray, copy)})
                // If the intersection is empty, add the date to the array
                } else {
                    let dateArray = selectedDate.concat(selectedDates);
                    setSelectedDate(dateArray);
                    setFilterMasks({...filterMasks, 'calendar': calculateCalendarMask(dateArray, copy)})
                }
            // If the date array is empty, add date to array
            } else {
                let dateArray = selectedDate.concat(selectedDates);
                setSelectedDate(dateArray);
                setFilterMasks({...filterMasks, 'calendar': calculateCalendarMask(dateArray, copy)})
            }
        };

        // Get month and pass all days in the month to selected
        const clickMonth = (d) => {
            let index = d.getMonth() + 1
            let filtered = copy.filter(d => d.month === index)
            changeDate(filtered.map(d => d.date))
        };

        // Functions to increment and decrement year with + and -
        const incrementYear = () => onYearSelected(selectedYear === maxYear ? selectedYear : selectedYear + 1);
        const decrementYear = () => onYearSelected(selectedYear === minYear ? selectedYear : selectedYear - 1);

        // Tranfsorm the data to get the count for each day
        let result = calendarColor === 'count'
            ? d3.rollup(data, v => v.length, d => d.date)
            : d3.rollup(data, v => d3.mean(v, d => (d[calendarColor])), d => d.date)

        // Get the max count
        const maxCount = d3.max(result, d => d[1]);
        const minCount = d3.min(result, d => d[1]);
        
        // Define color scale
        const color = d3.scaleSequential([minCount, maxCount], d3.interpolateYlGn)
        
        const svg = d3.select(svgCalendar.current);

        const year = svg.selectAll('g')
            .data(d3.range(selectedYear, selectedYear+1))
            .join('g')
            .attr('transform', `translate(${margins.left}, ${margins.top})`)
            .attr('class', 'calendar');
        
        // Add year
        year.selectAll("text")
            .data(d3.range(selectedYear, selectedYear+1))
            .join("text")
            .attr("transform", "translate(-40," + cellSize * 3.5 + ")rotate(-90)")
            .attr("font-family", "sans-serif")
            .attr("font-size", "1em")
            .attr("text-anchor", "middle")
            .text(d => d);

        // Add year
        year.selectAll(".increment")
            .data(['+'])
            .join("text")
            .attr("transform", `translate(-47, ${cellSize*2})`)
            .attr('class', 'increment')
            .attr("font-family", "sans-serif")
            .attr("font-size", "1.1em")
            .attr("text-anchor", "middle")
            .style('cursor', year !== maxYear ? 'pointer' : 'default')
            .text(d => d)
            .on('click', incrementYear)

        // Add year
        year.selectAll(".decrement")
            .data(['-'])
            .join("text")
            .attr("transform", `translate(-47, ${cellSize*6})`)
            .attr('class', 'decrement')
            .attr("font-family", "sans-serif")
            .attr("font-size", "1.7em")
            .attr("text-anchor", "middle")
            .style('cursor', year !== minYear ? 'pointer' : 'default')
            .text(d => d)
            .on('click', decrementYear)
        
        // Add rect for each day
        year.append('g')
            .attr('fill', '#EBEDF0')
            .attr('class', 'calendar')
            .selectAll('rect')
            .data(d => d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)))
            .join('rect')
                .attr('width', cellSize - 2)
                .attr('height', cellSize - 2)
                .attr("x", d => d3.timeMonday.count(d3.timeYear(d), d) * cellSize)
                .attr("y", d => d.getUTCDay() * cellSize + 1 )
                .datum(d3.timeFormat("%Y-%m-%d"))
                .style('fill', d => data.length === 0 ? 'rgb(235 237 240)' : color(result.get(d)))
                .attr("stroke", d => data.length === 0 ? 'white' : (selectedDate.includes(d) ? 'red' : 'white'))
                .attr('stroke-width', 2)
                .attr("rx", 1)
            .on("mouseover", function (e,d) {
                if (result.get(d) !== undefined) {
                    d3.select(this).attr('stroke', 'black');
                }
            })
            .on("mouseout", function (e,d) {
                selectedDate.includes(d) ? d3.select(this).attr('stroke', 'red') : d3.select(this).attr('stroke', 'white');
            })
            .style('cursor', d => result.get(d) !== undefined ? 'pointer' : 'default')
            .on('click', function (e, d) {
                if (result.get(d) !== undefined) {
                    changeDate([d]);
                };
            })
            .append("title")
            .text(d => {
                if (result.get(d) !== undefined) {
                    return(calendarColor === 'lights_off_clus' || calendarColor === 'lights_on_clus')
                        ? d + ' : ' + new Date(result.get(d)).getHours() + ':' + new Date(result.get(d)).getMinutes() 
                        : d + ' : ' + d3.format('.1f')(result.get(d))
                }
            });
        
        // Add day of week
        year.append('g')
            .attr("text-anchor", "end")
            .attr("class","calendar")
            .selectAll("text")
            .data((d3.range(7)).map(i => new Date(2020, 0, i)))
            .join('text')
                .attr("x", -5)
                .attr("y", d => (d.getUTCDay() + 0.5) * cellSize)
                .attr("dy", "0.31em")
                .attr('font-size', '12px')
                .text(d => arrayOfWeekdays[d.getDay()]);

        // Draw stroke for all months
        year.append('g')
            .attr('class', 'calendar')
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", "0.2px")
            .attr('class', 'month')
            .selectAll("path")
            .data(d => d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)))
            .join("path")
            .attr("d", function (d) {
                const t1 = new Date(d.getFullYear(), d.getMonth() + 1, 0),
                    d0 = d.getUTCDay(), w0 = d3.timeMonday.count(d3.timeYear(d), d),
                    d1 = t1.getUTCDay(), w1 = d3.timeMonday.count(d3.timeYear(t1), t1);
                return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
                    + "H" + w0 * cellSize + "V" + 7 * cellSize
                    + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
                    + "H" + (w1 + 1) * cellSize + "V" + 0
                    + "H" + (w0 + 1) * cellSize + "Z";
            });

        // Create month object
        const month = year.append("g")
            .attr('class', 'calendar')
            .selectAll('g')
            .data(d => d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)))
            .join('g');
    
        // Add month name
        month.append('text')
            .attr("class","month")
            .attr("x", d => cellSize + d3.timeMonday.count(d3.timeYear(d), d3.timeMonday(d)) * cellSize)
            .attr("y", -7)
            .attr('font-size', '12px')
            .style('cursor', 'pointer')
            .text(d => arrayOfMonths[d.getMonth()])
            .on('click', (d,i) => clickMonth(i)); 
            
        // Create legend
        const legendImage = svg.selectAll('image')
            .data([0])
            .join('image')
            .attr('class', 'legend')
            .attr("width", 100)
            .attr("height", legendSize)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());
        
        legendImage.attr('transform', `translate(${19*(width/20)},${height/1.65})rotate(-90)`)

        const legendText = svg.selectAll('.legendText')
            .data([0])
            .join('g')
            .attr('class', 'legendText')

        legendText.attr('transform', `translate(${margins.left/2},${0})`)
        
        legendText.selectAll('.text')
            .data(['Higher', 'Lower'])
            .join('text')
                .attr('class', 'text')
                .attr('x', width - 90)
                .attr('y', (d,i) => i === 0 ? 13 : 135)
                .attr('font-size', '12px')
                .text(d => d)

        // Enable the previous and next day buttons when only 1 day is selected. 
        selectedDate.length === 1 ? setButtonDisabled(false) : setButtonDisabled(true)

    }, [width, height, props, data, selectedDate, calendarColor, copy, filterMasks, setFilterMasks, cellSize, selectedYear, onYearSelected])

    return (
        <>
            <svg 
                className = 'calendar' 
                width={width} 
                height={height - 3.8*cellSize} 
                ref={svgCalendar}
            >
            </svg>
            {/* <svg height={34} width={height - 2*cellSize} ref={svgLegend} /> */}
            <div className={classes.root}>
                <Grid
                    container
                    className={classes.grid}
                    justify="space-evenly"
                    alignItems="flex-start"
                >
                    <Button 
                        onClick={clearSelection} 
                        className={classes.button}
                        variant='outlined'
                    >
                        Clear Selection
                    </Button>
                </Grid>
                <Grid
                    container
                    className={classes.grid}
                    justify="space-evenly"
                    alignItems="flex-start"
                >
                <ButtonGroup 
                    className={classes.buttonGroup}
                    variant="text" 
                    aria-label="text primary button group">
                    <Button disabled={buttonDisabled} onClick={decrementDay}>Previous day</Button>
                    <Button disabled={buttonDisabled} onClick={incrementDay}>Next day</Button>
                </ButtonGroup>
                </Grid>
                <Grid
                    container
                    className={classes.grid}
                    justify="space-evenly"
                    alignItems="flex-start"
                >
                    <FormControl className={classes.formControl} size='small'>
                    <Select
                        value={calendarColor}
                        onChange={changeCalendarColor}
                        label="calendarColor"
                        inputProps={{
                        name: 'calendarColor',
                        id: 'outlined-age-native-simple',
                        }}
                    >
                        <MenuItem key={'lights_off_clus'} value={'lights_off_clus'}>Lights off (hh:mm)</MenuItem>
                        <MenuItem key={'lights_on_clus'} value={'lights_on_clus'}>Lights on (hh:mm)</MenuItem>
                        <MenuItem key={'count'} value={'count'}>Number of diaries filled in</MenuItem>
                        <MenuItem key={'ac'} value={'ac'}>Number of awakenings</MenuItem>
                        <MenuItem key={'sc'} value={'sc'}>Number of sleep episodes</MenuItem>
                        <MenuItem key={'oobc'} value={'oobc'}>Number of times out of bed</MenuItem>
                        <MenuItem key={'se'} value={'se'}>Sleep efficiency</MenuItem>
                        <MenuItem key={'sol'} value={'sol'}>Sleep onset latency (minutes)</MenuItem>
                        <MenuItem key={'quality'} value={'quality'}>Sleep quality</MenuItem>
                        <MenuItem key={'twso'} value={'twso'}>Terminal wake time (minutes)</MenuItem>
                        <MenuItem key={'iwib'} value={'iwib'}>Total intended wake in bed time (minutes)</MenuItem>
                        <MenuItem key={'sit'} value={'sit'}>Total sleep intention time (minutes)</MenuItem>
                        <MenuItem key={'tst'} value={'tst'}>Total sleep time (minutes)</MenuItem>
                        <MenuItem key={'taib'} value={'taib'}>Total time awake in bed (minutes)</MenuItem>
                        <MenuItem key={'tib'} value={'tib'}>Total time in bed (minutes)</MenuItem>
                        <MenuItem key={'waso'} value={'waso'}>Wake after sleep onset (minutes)</MenuItem>
                        <MenuItem key={'rested'} value={'rested'}>Well rested</MenuItem>
                    </Select>
                    <FormHelperText>Choose a parameter to show in the calendar</FormHelperText>
                    </FormControl>
                </Grid>
            </div>
        </>
    )
};

export default Calendar;