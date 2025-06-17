// Fetch the Mapbox access token from the backend
fetch('http://127.0.0.1:5000/get-mapbox-token')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const mapboxToken = data.mapbox_access_token;

        // Initialize Mapbox map
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-0.1278, 51.5074],
            zoom: 11,
            accessToken: mapboxToken,
            pitch: 45,
            bearing: 0
        });

        // Enable 3D buildings
        map.on('load', async () => {
            map.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.6
                }
            });

            // Allow map navigation
            map.dragRotate.enable();
            map.touchZoomRotate.enableRotation();
            map.addControl(new mapboxgl.NavigationControl());

            // Add potential nodes to the map
            await addPotentialNodes(map);

            // Add event listener for the toggle button
            document.getElementById('toggle-potential-nodes').addEventListener('click', () => {
                togglePotentialNodes(map);
            });
        });

        // Fetch TfL BikePoint API data
        fetch('https://api.tfl.gov.uk/BikePoint')
            .then(response => response.json())
            .then(bikeData => {
                // Extract coordinates and names
                const points = bikeData.map(point => ({
                    name: point.commonName,
                    lat: parseFloat(point.lat),
                    lon: parseFloat(point.lon)
                }));

                // Convert points to [lon, lat] format for Delaunay
                const coordinates = points.map(d => [d.lon, d.lat]);

                // Create Delaunay and Voronoi diagrams
                const delaunay = d3.Delaunay.from(coordinates);
                const voronoi = delaunay.voronoi([-0.5, 51.3, 0.5, 51.7]); // London bounding box

                // Add docking stations as markers
                points.forEach(point => {
                    // Create a custom HTML element for the marker
                    const markerElement = document.createElement('div');
                    markerElement.style.width = '4px'; // Adjust size
                    markerElement.style.height = '4px'; // Adjust size
                    markerElement.style.borderRadius = '50%';
                    markerElement.style.backgroundColor = 'orange';
                    markerElement.style.boxShadow = '0 0 5px orange';

                    new mapboxgl.Marker({ element: markerElement })
                        .setLngLat([point.lon, point.lat])
                        .setPopup(new mapboxgl.Popup().setText(point.name))
                        .addTo(map);
                });

                // Prepare Voronoi edges as GeoJSON
                const features = [];

                // Loop through each Voronoi cell
                for (let i = 0; i < delaunay.points.length / 2; i++) {
                    const cell = voronoi.cellPolygon(i);
                    if (cell) {
                        for (let j = 0; j < cell.length - 1; j++) {
                            const start = cell[j];
                            const end = cell[j + 1];
                            features.push({
                                type: 'Feature',
                                geometry: {
                                    type: 'LineString',
                                    coordinates: [
                                        [start[0], start[1]],
                                        [end[0], end[1]]
                                    ]
                                }
                            });
                        }
                    }
                }

                // Add Voronoi edges to Mapbox as a GeoJSON layer
                map.on('load', () => {
                    const voronoiGeoJSON = {
                        type: 'FeatureCollection',
                        features: features
                    };

                    map.addSource('voronoi-lines', {
                        type: 'geojson',
                        data: voronoiGeoJSON
                    });

                    map.addLayer({
                        id: 'voronoi-lines-layer',
                        type: 'line',
                        source: 'voronoi-lines',
                        paint: {
                            'line-color': 'gray',
                            'line-width': 1
                        }
                    });
                });
            })
            .catch(error => console.error('Error fetching TfL data:', error));
    })
    .catch(error => console.error('Error fetching Mapbox token:', error));

// Function to load and parse `potential_node.csv`
async function loadPotentialNodesCSV() {
    const response = await fetch('https://potentialbikenodes.s3.eu-west-2.amazonaws.com/potential_nodes.csv');
    if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = csvText.split('\n').slice(1); // Remove header row

    return rows
        .filter(row => row.trim()) // Remove empty rows
        .map(row => {
            const [start_lat, start_lon, end_lat, end_lon] = row.split(',').map(Number);
            return {
                start: [start_lon, start_lat],
                end: [end_lon, end_lat]
            };
        });
}


// Add potential nodes to the map
async function addPotentialNodes(map) {
    try {
        const edges = await loadPotentialNodesCSV();

        // Validate that edges is an array
        if (!Array.isArray(edges)) {
            throw new Error('Invalid edges data format.');
        }

        // Prepare GeoJSON for potential nodes
        const potentialNodesGeoJSON = {
            type: 'FeatureCollection',
            features: edges.flatMap(edge => [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: edge.start
                    }
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: edge.end
                    }
                }
            ])
        };

        // Add source and layer for potential nodes
        map.addSource('potential-nodes', {
            type: 'geojson',
            data: potentialNodesGeoJSON
        });

        map.addLayer({
            id: 'potential-nodes-layer',
            type: 'circle',
            source: 'potential-nodes',
            paint: {
                'circle-radius': 3,
                'circle-color': 'blue',
                'circle-opacity': 0.7
            }
        });
    } catch (error) {
        console.error('Error adding potential nodes:', error);
    }
}



// Toggle visibility of the potential nodes layer
function togglePotentialNodes(map) {
    const layerId = 'potential-nodes-layer';
    if (map.getLayer(layerId)) {
        const visibility = map.getLayoutProperty(layerId, 'visibility');
        map.setLayoutProperty(
            layerId,
            'visibility',
            visibility === 'visible' ? 'none' : 'visible'
        );
    } else {
        console.warn(`Layer not found: ${layerId}`);
    }
}

