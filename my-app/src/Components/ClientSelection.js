import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import { makeStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import { MenuItem } from '@material-ui/core';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormHelperText from '@material-ui/core/FormHelperText';

const useStyles = makeStyles((theme) => ({
    formControl: {
      margin: theme.spacing(1),
      minWidth: '90%',
      marginBottom: theme.spacing(0)
    }, 
    dropdown: {
        marginBottom: theme.spacing(1)
    }
}));

export default function ClientSelection(props) {
    const year = props.year;
    const data = (props.data).filter(d => d.year === year)
    const filterMasks = props.filterMasks;
    const setFilterMasks = props.setFilterMasks;
    const copy = props.data;
    const client = props.client;
    const onClientSelected = props.onClientSelected;
    const onIncludeNoiseSelected = props.onIncludeNoiseSelected;
    const includeNoise = props.includeNoise;

    // Get all unique client ids and for each client id create a MenuItem
    const unique = ([...new Set(data.map(d => d.client_id))]).sort((a,b) => (a-b))
    const options = (unique.map((id, index) => (
        <MenuItem key={index} value={id}>
            {id}
        </MenuItem>)
    ))

    const calculateClientMask = (client, data) => {
        return data.map(d => {
            return { 
                id: d.id,
                value: client.includes('empty')? false : (client.includes('select all') ? true : client.includes(d.client_id))
            }
        })
    };

    // Change the selected client
    const changeClient = (e) => {
        if (e.target.value.includes('all')) {
            if (client.length === unique.length) {
                setFilterMasks({...filterMasks, 'client': calculateClientMask(['empty'], copy)})
                onClientSelected([])
            } else {
                setFilterMasks({...filterMasks, 'client': calculateClientMask(['select all'], copy)})
                onClientSelected(unique)
            }
        } else {
            setFilterMasks({...filterMasks, 'client': calculateClientMask(e.target.value, copy)})
            onClientSelected(e.target.value)
        }
    };

    const changeIncludeNoise = (e) => {
        onIncludeNoiseSelected(e.target.value);
    }

    const classes = useStyles();

    return (
        <div className='subjectComponent'>
            <div className='clientDropdown'>
                <FormControl className={classes.formControl} size='small'>
                    <FormLabel component="legend">Select subject ID</FormLabel>
                        <Select
                            multiple
                            className={classes.dropdown}
                            value={client}
                            onChange={changeClient}
                            inputProps={{
                            id: 'demo-mutiple-chip'
                            }}
                        >
                            <MenuItem value={'all'} key={'all'}>{client.length === unique.length ? 'Remove all' : 'Select all'}</MenuItem>
                            {options}
                        </Select>
                </FormControl>
            </div>
            <div className='includeNoise'>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend">Noise</FormLabel>
                    <RadioGroup aria-label="grouping" value={includeNoise} onChange={changeIncludeNoise} className={classes.radio} row>
                        <FormControlLabel value="exclude" control={<Radio color='primary' size='small' />} label="Exclude" />
                        <FormControlLabel value="include" control={<Radio color='primary' size='small' />} label="Include" />
                    </RadioGroup>
                    <FormHelperText>{includeNoise === 'exclude' ? 'Change to include the noise from the clustering algorithm.' : 'Change to exclude the noise from the clustering algorithm.'}</FormHelperText>
                </FormControl> 
            </div>
        </div>
    )
}