# SleepVis

The input shoudl be a JSON file of the following format:
```
[
  {"id": 5960, 
    "patient_id": 1144, 
    "Latitude": 51.4916747, 
    "Longitude": 5.4399474, 
    "slaapkwaliteit": 0.9137806375, 
    "uitgerust": 0.6600942871, 
    "latitude": 51.4330172, 
    "longitude": 5.4895835, 
    "states": [{"state": "awakeInBed_on", "start": "2021-08-21 23:35:00", "end": "2021-08-21 23:45:00"}, {"state": "awakeInBed_off", "start": "2021-08-21 23:45:00", "end": "2021-08-21 23:50:00"}, {"state": "sleep_off", "start": "2021-08-21 23:50:00", "end": "2021-08-22 04:30:00"}, {"state": "awakeInBed_off", "start": "2021-08-22 04:30:00", "end": "2021-08-22 04:40:00"}, {"state": "sleep_off", "start": "2021-08-22 04:40:00", "end": "2021-08-22 07:35:00"}], 
    "count": 2, 
    "tst": 455.0, 
    "sit": 470.0, 
    "se": 0.9680851063829787, 
    "lights_off": "2021-08-21 23:45:00", 
    "lights_on": "2021-08-22 07:35:00"}
]
```
