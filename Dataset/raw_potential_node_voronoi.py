"""
Voronoi Diagram Generator for TfL Bike Sharing Stations

This script is used to fetch the data from the TfL API for bike docking stations before computing the voronoi diagram and extract the edges as coordinates.
"""

# Import Libraries
from scipy.spatial import Voronoi
import requests
import numpy as np
import csv
from secret_manager import get_secret

# Get Mapbox API Token
secret_name = "masters-project"
secret = get_secret(secret_name)
mapbox_token = secret.get("mapbox_public")

# Fetch data from TfL API
url = "https://api.tfl.gov.uk/BikePoint"
response = requests.get(url).json()

# Extract coordinates and names of bike points
coordinates = [(float(point['lon']), float(point['lat'])) for point in response]  # Correct order [lon, lat]
names = [point['commonName'] for point in response]

# Voronoi
points = np.array(coordinates)
vor = Voronoi(points)

# Generate Voronoi edges
edges_coordinates = []
for simplex in vor.ridge_vertices:
    if -1 not in simplex:  # Ignore infinite edges
        start = vor.vertices[simplex[0]]  # [lon, lat]
        end = vor.vertices[simplex[1]]    # [lon, lat]
        edges_coordinates.append({
            'start_lat': start[1],  # Convert back to [lat, lon] for output
            'start_lon': start[0],
            'end_lat': end[1],
            'end_lon': end[0]
        })

# Write to CSV
output_file = "Voronoi_edges.csv"
with open(output_file, mode='w', newline='') as file:
    writer = csv.DictWriter(file, fieldnames=['start_lat', 'start_lon', 'end_lat', 'end_lon'])
    writer.writeheader()
    writer.writerows(edges_coordinates)

print(f"Voronoi edges written to {output_file}")