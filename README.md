# Towards Equitable Bike-Sharing: A Markov Decision Process-Based Planning Approach
This is the repository for the **Towards Equitable Bike-Sharing** master’s project. The objective of this study is to propose an optimisation framework for the expansion strategy of bike-sharing station placements in London, aiming to balance demand and socioeconomic equality. Two spatial partitioning techniques (H3 & Voronoi Tessellation) were implemented and compared to evaluate their effectiveness in the candidate station selection process. Markov Decision Processes were then implemented to output a sequential list of locations to build new stations. The results were then evaluated for improvements in network coverage and travel times through static coverage evaluation and Simulation of Urban MObility (SUMO). This study concluded that an H3-driven MDP framework is a practical methodology for planning bicycle-sharing stations, balancing potential demand and equality.

![H3 Results](figures/H3%20results.png)

---

## Project Structure
- Dataset collection and cleaning
- Spatial partitioning of the study area (Voronoi and H3)
- MDP Formulation
- Static Evaluation
- SUMO Simulation

## File Explanations
Here’s the breakdown of the key files in this repository and their purpose:
- **`mdp.ipynb`**: Main notebook for running the MDP for the optimisation of potential demand & equity
- **`static_evaluation.ipynb`**: Notebook containing all the static evaluation and visualisations of the results (Each interactive map is massive and therefore must run locally. They can't be displayed on GitHub).
- **`trip_generator.ipynb`**: Generate valid OD pairs for SUMO simulations

## Usage: SUMO Simulation
1. Prepare your SUMO configuration files:
   1. **`london.net.xml`** -- network
   2. **`trips_before.rou.xml`** and **`trips_after.rou.xml`** -- routes
   3. **`sumo_config_before.sumocfg`** and **`sumo_config_after.sumocfg`** -- configuration files
2. Run baseline simulation:
   ```console
    sumo -c sumo_config_before.sumocfg --tripinfo-output tripinfo_before.xml
   ```
3. Run after new station placements (Do edit the config and route files to change between Voronoi and H3 case):
   ```console
    sumo -c sumo_config_after.sumocfg --tripinfo-output tripinfo_after.xml
   ```
4. (Optional) Use GUI for visualisation:
   ```console
    sumo-gui -c sumo_config_before.sumocfg
   ```

---

## Data Sources
- TfL Open Data ([Santander journey data](https://cycling.data.tfl.gov.uk/))
- [UK Census](https://www.nomisweb.co.uk/query/select/getdatasetbytheme.asp?opt=3&theme=&subgrp=)
- [OpenStreetMap](https://extract.bbbike.org/) (road network for SUMO)

---

## Output
- **`static_evaluation.ipynb`**: Static Evaluation Results
- **`tripinfo`**: Detailed trip metrics from SUMO simulations

---

## Acknowledgements
I would like to thank [Dr. Pietro Ferraro](https://profiles.imperial.ac.uk/p.ferraro) for his guidance, support, and encouragement throughout this project. I would also like to thank [Dr. Freddie Page](https://profiles.imperial.ac.uk/freddie.page) for his valuable feedback during the Early Stage Gateway and Late Stage Gateway sessions, and [Prof. Robert Shorten](https://profiles.imperial.ac.uk/r.shorten) for sharing his expertise on the sharing economy and providing me with access to his module contents.
  
