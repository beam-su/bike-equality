import pandas as pd
import requests
from secret_manager import get_secret

# Define constants
input = 'BikeNodeDataset\Voronoi_edges.csv'
output = 'potential_nodes.csv'
tfl_api_url = "https://api.tfl.gov.uk/BikePoint"
mapbox_token = get_secret("masters-project").get("mapbox_public")

# Load the edges data
edges_df = pd.read_csv(input)

# Combine all start and end coordinates from Voronoi edges
all_coordinates = (
    edges_df[['start_lat', 'start_lon']].values.tolist() +
    edges_df[['end_lat', 'end_lon']].values.tolist()
)

# Helper function to round and remove duplicate coordinates
def process_coordinates(coordinate_list, decimals=6):
    return list({tuple(round(c, decimals) for c in coord): coord for coord in coordinate_list}.values())

# Snap coordinates to the nearest road using Mapbox API
def snap_to_road(coord):
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{coord[1]},{coord[0]}.json?access_token={mapbox_token}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        features = response.json().get('features', [])
        if features:
            snapped_coord = features[0]['geometry']['coordinates']
            print("Coordinate Snapped Successfully")  # Debug
            return [snapped_coord[1], snapped_coord[0]]  # [lat, lon]
    except requests.RequestException as e:
        print(f"Error snapping coordinate {coord}: {e}")
    return coord  # Return original coordinate if API fails

# Remove duplicates and snap coordinates to roads
unique_coordinates = process_coordinates(all_coordinates)
snapped_coordinates = {tuple(coord): snap_to_road(coord) for coord in unique_coordinates}

# Fetch existing docking station locations from TfL API
def fetch_tfl_docking_stations():
    try:
        response = requests.get(tfl_api_url)
        response.raise_for_status()
        stations = response.json()
        return [[station["lat"], station["lon"], station["id"], station["commonName"]] for station in stations]
    except requests.RequestException as e:
        print(f"Error fetching TfL docking stations: {e}")
        return []

# Fetch existing docking stations after snapping potential nodes
tfl_docking_stations = fetch_tfl_docking_stations()

# Assign self-generated unique IDs to potential nodes
potential_nodes = list(snapped_coordinates.values())
potential_nodes_with_ids = [[lat, lon, f"potential_{i}", "Potential Node"] for i, (lat, lon) in enumerate(potential_nodes)]

# Combine existing docking stations (with API IDs and names) and potential nodes (self-assigned IDs with placeholder names)
all_nodes = potential_nodes_with_ids + tfl_docking_stations

# Save the updated dataset
nodes_df = pd.DataFrame(all_nodes, columns=["lat", "lon", "id", "name"])
nodes_df.to_csv(output, index=False)

print(f"Updated nodes saved to {output}")