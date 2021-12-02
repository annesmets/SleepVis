import React, { useEffect } from 'react'
import L from "leaflet";
import "../Legend.css";

export default function Legend(props) {
  const map = props.map;

  useEffect(() => {
    if (map) {
      const legend = L.control({position: 'topright'})

      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'legendContainer' )

        div.innerHTML = `
          <div>
            Higher
          </div>
          <div 
            style='
              background-image: linear-gradient(#005a32, #ffffcc); 
              width: 16px; 
              height: 100px;
              margin:auto;
              z-index: 1000;
            '
          ></div>
          <div id='lower'>
            Lower
          </div>
        `
        return div;
      };

      legend.addTo(map);

    }
  }, [map])

  return null;
}
