import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import FormLabel from '@material-ui/core/FormLabel';
import FormHelperText from '@material-ui/core/FormHelperText';

const useStyles = makeStyles((theme) => ({
    root: {
        flexDirection:'row',
        minWidth: 500,
        marginRight: theme.spacing(2),
        marginLeft: theme.spacing(1),
        marginTop: theme.spacing(1),
    }
  }));

export default function EpsilonSlider(props) {
    const epsilon = props.epsilon;
    const groupLevel = props.groupLevel;

    const classes = useStyles();

    const marks = [
        {
            value:0.1,
            label:'0.1'
        }, 
        {
            value:3.0,
            label:'3.0'
        }
    ]

    if (groupLevel !== 'night') {
        return (
            <>
                <div className={classes.root}>
                    <FormLabel component="legend">Cluster setting</FormLabel>
                    <Slider 
                        aria-labelledby={'slider'}
                        value={epsilon}
                        onChange={(e,value) => props.onEpsilonSelected(value)}
                        step={0.1}
                        min={0.1}
                        max={3}
                        valueLabelDisplay={'auto'}
                        marks
                        disabled
                    />
                    <FormHelperText>You can't change epsilon when you're grouping by {groupLevel}</FormHelperText>
                </div>
            </>
        )
    } else {
        return (
            <>
                <div className={classes.root}>
                    <FormLabel component="legend">Cluster setting</FormLabel>
                    <Slider 
                        aria-labelledby={'slider'}
                        value={epsilon}
                        onChange={(e,value) => props.onEpsilonSelected(value)}
                        step={0.1}
                        min={0.1}
                        max={3.0}
                        valueLabelDisplay={'auto'}
                        marks
                    />
                    <FormHelperText>Change epsilon by moving the slider to identify clusters in the sleep patterns.</FormHelperText>
                </div>
            </>
        )
    }
}