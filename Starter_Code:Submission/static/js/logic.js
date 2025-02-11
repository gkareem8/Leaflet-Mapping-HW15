// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// OPTIONAL: Step 2
// Create the 'street' tile layer as a second background of the map.
let streetMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [40.7, -94.5], // Coordinates to center the map (USA)
  zoom: 3, // Initial zoom level
  layers: [basemap] // 'basemap' layer by default
});

// Then add the 'basemap' tile layer to the map.
basemap.addTo(map);

// OPTIONAL: Step 2
// Create the layer groups, base maps, and overlays for our two sets of data, earthquakes and tectonic_plates.
let earthquakeLayer = L.layerGroup(); // Earthquake markers group
let tectonicPlateLayer = L.layerGroup(); // Tectonic plates group

// Add a control to the map that will allow the user to change which layers are visible.
let baseMaps = {
  "Basemap": basemap,
  "Street": streetMap
};

let overlayMaps = {
  "Earthquakes": earthquakeLayer,
  "Tectonic Plates": tectonicPlateLayer
};

// Initialize the Layer Control
L.control.layers(baseMaps, overlayMaps).addTo(map);

// This function determines the color of the marker based on the depth of the earthquake.
function getColor(depth) {
  if (depth > 90) {
    return "#ea2c2c"; // Red for deep earthquakes
  } else if (depth > 70) {
    return "#ea822c"; // Orange
  } else if (depth > 50) {
    return "#ee9c00"; // Yellow
  } else if (depth > 30) {
    return "#eecc00"; // Light yellow
  } else if (depth > 10) {
    return "#d4ee00"; // Greenish yellow
  } else {
    return "#98ee00"; // Light green for shallow earthquakes
  }
}

// This function determines the radius of the earthquake marker based on its magnitude.
function getRadius(magnitude) {
  if (magnitude === 0) {
    return 1; // If magnitude is zero, use radius 1 
  }
  return magnitude * 4; // Scale the radius based on magnitude
}

// Make a request that retrieves the earthquake geoJSON data.
let queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
d3.json(queryUrl).then(function (data) {

  // Loop through earthquakes
  let markers = [];
  for (let i = 0; i < data.features.length; i++) {
    let row = data.features[i];
    let location = row.geometry.coordinates;
    if (location) {
      let latitude = location[1];
      let longitude = location[0];
      let depth = location[2];

      // Create Marker
      let marker = L.circleMarker([latitude, longitude], {
        fillOpacity: 0.75,
        color: "white",
        fillColor: getColor(depth),
        radius: getRadius(row.properties.mag)
      }).bindPopup(`<h1>${row.properties.title}</h1><hr><h2>Depth: ${depth}m</h2>`);

      markers.push(marker);
    }
  }

  // Create the Layer GROUPS
  let markerLayer = L.layerGroup(markers);  // Combine all markers into one layer group

  // Add the Earthquake markers to the Earthquake layer
  markerLayer.addTo(earthquakeLayer);

  // Add the Earthquake layer to the map
  earthquakeLayer.addTo(map);

  // OPTIONAL: Step 2
  // Make a request to get our Tectonic Plate geoJSON data.
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {
    // Save the geoJSON data, along with style information, to the tectonic_plates layer.
    L.geoJson(plate_data, {
      color: "green",
      weight: 2
    }).addTo(tectonicPlateLayer);

    // Then add the tectonic_plates layer to the map.
    tectonicPlateLayer.addTo(map);
  });

  // Create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  // Add details for the legend.
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");
    let depths = [0, 10, 30, 50, 70, 90]; // Depth intervals
    let colors = ["#98ee00", "#d4ee00", "#eecc00", "#ee9c00", "#ea822c", "#ea2c2c"]; 
    let labels = [];

    // Loop through depth intervals to generate a label with a colored square for each interval.
    for (let i = 0; i < depths.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+');
    }

    return div;
  };

  // Finally, add the legend to the map.
  legend.addTo(map);

});
