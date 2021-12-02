import React from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { makeStyles } from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import { MenuItem } from '@material-ui/core';

export default function RadioButtons(props) {
    const onMapAverageSelected = props.onMapAverageSelected;
    const onMapColorSelected = props.onMapColorSelected;
    const groupLevel = props.groupLevel;
    const mapColor = props.mapColor;

    const useStyles = makeStyles((theme) => ({
      formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
      },
      radio: {
        marginBottom: theme.spacing(0)
      },
      dropdown: {
        marginBottom: theme.spacing(1)
      }
    }));

    const classes = useStyles();

    // Change the level using the radio buttons
    const changeLevel = (e) => {
      onMapAverageSelected(e.target.value);
    };

    // Change the parameter that is shown on the map
    const changeMapColor = (e) => {
      onMapColorSelected(e.target.value);
    };

    return (
        <div className='radioComponent'>
          <div className='mapDropdown'>
            <FormControl className={classes.formControl} size='small'>
              <FormLabel component="legend">Color on the map</FormLabel>
              <Select
                className={classes.dropdown}
                value={mapColor}
                onChange={changeMapColor}
                label="mapcolor"
                inputProps={{
                  name: 'mapcolor',
                  id: 'outlined-age-native-simple',
                }}
              >
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
              <FormHelperText>Choose a parameter to display on the map</FormHelperText>
            </FormControl>
          </div>
          <div className='averageMap' >
            <FormControl component="fieldset" className={classes.formControl}>
                  <FormLabel component="legend">Average</FormLabel>
                  <RadioGroup aria-label="grouping" value={groupLevel} onChange={changeLevel} className={classes.radio} row>
                      <FormControlLabel value="night" control={<Radio color='primary' size='small' />} label="None" />
                      <FormControlLabel value="individual" control={<Radio color='primary' size='small' />} label="Per individual" />
                      <FormControlLabel value="cluster" control={<Radio color='primary' size='small' />} label="Per cluster" />
                  </RadioGroup>
                  <FormHelperText>Change the average to see the average per individual or cluster over the selected time.</FormHelperText>
              </FormControl> 
          </div>

          
        </div>
    )
}