# SleepVis

![image](https://user-images.githubusercontent.com/34477812/144436385-54e8984f-e52d-4c05-b996-6f1cba96a06e.png)

The input should be a JSON file of the following format:
```
[
  {"id": 5960, 
    "client_id": 1144, 
    "Latitude": 51.4916747, 
    "Longitude": 5.4399474, 
    "quality": 0.9137806375, 
    "rested": 0.6600942871, 
    "states": [
      {"state": "awakeInBed_on", "start": "2021-08-21 23:35:00", "end": "2021-08-21 23:45:00"}, 
      {"state": "awakeInBed_off", "start": "2021-08-21 23:45:00", "end": "2021-08-21 23:50:00"}, 
      {"state": "sleep_off", "start": "2021-08-21 23:50:00", "end": "2021-08-22 04:30:00"}, 
      {"state": "awakeInBed_off", "start": "2021-08-22 04:30:00", "end": "2021-08-22 04:40:00"}, 
      {"state": "sleep_off", "start": "2021-08-22 04:40:00", "end": "2021-08-22 07:35:00"}], 
    "lights_off": "2021-08-21 23:45:00", 
    "lights_on": "2021-08-22 07:35:00"}
]
```
More about this project can be read [here](https://github.com/annesmets/SleepVis/blob/master/Thesis_Anne_Smets.pdf).
