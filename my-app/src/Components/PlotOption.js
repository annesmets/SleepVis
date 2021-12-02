import React from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { makeStyles } from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';

const useStyles = makeStyles((theme) => ({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
      marginBottom: theme.spacing(0)
    }, 
    dropdown: {
        marginBottom: theme.spacing(1)
    }
}));

const PlotOption = (props) => {
    const onPlotSelected = props.onPlotSelected;
    const plot = props.plot;
    const keys = props.keys;
    const plotAverage = props.plotAverage;
    const onMapAverageSelected = props.onMapAverageSelected;

    // Change the type of plot (pcp or scatterplot)
    const changePlot = (e) => {
        onPlotSelected(e.target.value)
    };

    const changePlotAverage = (e) => {
        onMapAverageSelected(e.target.value);
    };
  
    const classes = useStyles();

    if (keys.length > 2) {
        onPlotSelected('pcp')
        return (
            <div className='plotComponent'>
                <div className='plotOption'>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Type of Plot</FormLabel>
                        <RadioGroup aria-label="plottype" value={plot} onChange={changePlot} row>
                            <FormControlLabel value="pcp" control={<Radio color='primary' size='small'/>} label="Parallel Coordinates Plot" />
                            <FormControlLabel value="scatter" disabled control={<Radio color='primary' size='small'/>} label="Scatterplot" />
                        </RadioGroup>
                        <FormHelperText>Select 2 parameters to choose the scatterplot.</FormHelperText>
                    </FormControl> 
                </div>
                <div className='averagePlot' >
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Average</FormLabel>
                        <RadioGroup aria-label="grouping" value={plotAverage} onChange={changePlotAverage} className={classes.radio} row>
                            <FormControlLabel value="night" control={<Radio color='primary' size='small' />} label="None" />
                            <FormControlLabel value="individual" control={<Radio color='primary' size='small' />} label="Per subject" />
                            <FormControlLabel value="cluster" control={<Radio color='primary' size='small' />} label="Per cluster" />
                        </RadioGroup>
                        <FormHelperText>Change the average to see the average per subject or cluster over the selected time.</FormHelperText>
                    </FormControl> 
                </div>
            </div>
        )
    } else {
        return (
            <div className='plotComponent'>
                <div className='plotOption'>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Type of Plot</FormLabel>
                        <RadioGroup aria-label="plottype" value={plot} onChange={changePlot} row>
                            <FormControlLabel value="pcp" control={<Radio color='primary' size='small' />} label="Parallel Coordinates Plot" />
                            <FormControlLabel value="scatter" control={<Radio color='primary' size='small' />} label="Scatterplot" />
                        </RadioGroup>
                        <FormHelperText>Choose the type of plot you want to see below.</FormHelperText>
                    </FormControl> 
                </div>
                <div className='averagePlot' >
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Average</FormLabel>
                        <RadioGroup aria-label="grouping" value={plotAverage} onChange={changePlotAverage} className={classes.radio} row>
                            <FormControlLabel value="night" control={<Radio color='primary' size='small' />} label="None" />
                            <FormControlLabel value="individual" control={<Radio color='primary' size='small' />} label="Per subject" />
                            <FormControlLabel value="cluster" control={<Radio color='primary' size='small' />} label="Per cluster" />
                        </RadioGroup>
                        <FormHelperText>Change the average to see the average per subject or cluster over the selected time.</FormHelperText>
                    </FormControl> 
                </div>
            </div>
        )
    }
    
};

export default  PlotOption;