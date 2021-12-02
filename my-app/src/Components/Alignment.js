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
    }
  }));

export default function Alignment(props) {
    const alignment = props.alignment;
    const onAlignmentSelected = props.onAlignmentSelected;
    const grouping = props.grouping;
    const onGroupingSelected = props.onGroupingSelected;

    const changeAlignment = (e) => {
        onAlignmentSelected(e.target.value)
    };

    const changeGrouping = (e) => {
        onGroupingSelected(e.target.value)
    };

    const classes = useStyles();

    return (
        <div className='aggregationComponent'>
            <div className='viewOption'>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend">View</FormLabel>
                    <RadioGroup aria-label="plottype" value={alignment} onChange={changeAlignment} row>
                        <FormControlLabel value="relative" control={<Radio color='primary' size='small' />} label="Night view" />
                        <FormControlLabel value="absolute" control={<Radio color='primary' size='small' />} label="Calendar view" />
                    </RadioGroup>
                    <FormHelperText>{alignment === 'relative' ? 'Change the view to see the data over multiple days.' : 'Change the view to see all nights stacked on top.'}</FormHelperText>
                </FormControl> 
            </div>
            <div className='groupOption'>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend">Grouping</FormLabel>
                        <RadioGroup aria-label="plottype" value={grouping} onChange={changeGrouping} row>
                            <FormControlLabel value="client" disabled={alignment === 'relative' ? false : true} control={<Radio color='primary' size='small' />} label="Group by subject" />
                            <FormControlLabel value="date" disabled={alignment === 'relative' ? false : true} control={<Radio color='primary' size='small'/>} label="Group by date" />
                        </RadioGroup>
                    <FormHelperText>{alignment === 'relative' ?  (grouping === 'client' ? 'Change the grouping to group by date' : 'Change the grouping to group by subject.') : 'You can only select grouping in the night view.'}</FormHelperText>
                </FormControl>
            </div>
        </div>
    )
}
