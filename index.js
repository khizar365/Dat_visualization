document.addEventListener('DOMContentLoaded', function () {
    async function initGlobe() {


        const btnTest = document.getElementById('test');

        try {
            // Fetch data from JSON files
            const deathsResponse = await fetch("./deaths.json");
            const latlngResponse = await fetch("./latlngdata.json");

            if (!deathsResponse.ok || !latlngResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const deathsData = await deathsResponse.json();
            const latlngData = await latlngResponse.json();
            const mergedDataset = [];

            deathsData.forEach((el) => {
                const location = latlngData[el.State];
                if (location) {
                    mergedDataset.push({
                        lat: Number(location.lat.replace(",", ".")),
                        lng: Number(location.lng.replace(",", ".")),
                        weight: el.Deaths,
                        year: el.Year,
                        causeName: el['Cause Name'],
                        state: el.State
                    });
                }
            });

            // const transformedDataset = mergedDataset.filter(el => el.causeName === "Kidney disease").filter(el => el.year === 1999);
            var transformedDataset = mergedDataset;
            var pointsData = mergedDataset.map(d => Object.assign({}, d));



            console.log(transformedDataset);

            function heatmap(h, e, lla) {
                console.log(h, e, lla);
            }

            // function prevHeatmap(e) {
            //   console.log(e);
            // }

            // world.heatmapsData(mergedDataset);
            console.log('points', pointsData);
            let maxAltitude = 0;
            pointsData.forEach(el => {
                if(el.weight > maxAltitude) maxAltitude = el.weight;
            })

            console.log('max', maxAltitude)
            const altitudeScale = d3.scaleLinear([1, maxAltitude], [0, 1]);

            const world = Globe()
                // .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                // Globe Layer
                .enablePointerInteraction(true)
                .globeImageUrl('./earth_lights_dimmest.jpg')

                // Heatmap Layer
                .heatmapsData([transformedDataset])
                .heatmapPointLat('lat')
                .heatmapPointLng('lng')
                .heatmapPointWeight('weight') // The key to use for the heatmap weight
                .heatmapTopAltitude(1)
                .heatmapBandwidth(1.35)
                .heatmapColorSaturation(3.2)
                .onHeatmapClick(heatmap)
                // .heatmapsTransitionDuration([10000])

                // Points Layer
                // .pointsData(transformedDataset)
                // .pointLabel("label")
                // .pointColor((d) =>
                //     colorScheme(options.colorScheme)(scales[options.scale](d.color))
                // )
                // .pointAltitude(1)
                // .pointRadius(0.05)
                // .onGlobeReady(() => {
                //     globe.pointOfView(
                //         { lat: cork.lat - 3, lng: cork.long + 10, altitude: 0.75 },
                //         5000
                //     );
                // })

                // TODO: Points layer stuff here...

                .pointsData(pointsData)
                .pointLabel((d) => `<strong>${d.state}</strong><br>Deaths: ${d.weight}`)
                .pointColor(() => 'rgba(255, 165, 0, 0.8)') // Orange color for points
                .pointAltitude((d) => altitudeScale(d.weight)) // Altitude of the points
                .pointRadius(0.2) // Radius of points
                .onPointClick((d) => {
                    console.log(`Clicked on point: ${d.state}`);
                })


            (document.getElementById('globeViz'));


            // Centre the view on the U.S. when the globe loads
            world.pointOfView({ lat: 41.775760, lng: -126.120769, altitude: 2 })


            function updateGlobeData() {
                const selectedYears = Array.from(document.querySelectorAll('.year-button.active')).map(btn => +btn.innerText);
                const selectedDiseases = Array.from(document.querySelectorAll('.disease-button.active')).map(btn => btn.innerText);
                const selectedStates = Array.from(document.querySelectorAll('.state-button.active')).map(btn => btn.innerText);

                let filteredData = mergedDataset;

                if (selectedYears.length > 0) filteredData = filteredData.filter(el => selectedYears.includes(el.year));
                if (selectedDiseases.length > 0) filteredData = filteredData.filter(el => selectedDiseases.includes(el.causeName));
                if (selectedStates.length > 0) filteredData = filteredData.filter(el => selectedStates.includes(el.state));

                world.heatmapsData([filteredData]);
            }

            // Function to toggle button color between green and yellow and apply filters
            function handleButtonClick(event) {
                const button = event.target;

                // Toggle 'active' class
                button.classList.toggle('active');

                // Update globe data based on current filters
                updateGlobeData();
            }

            // Attach event listeners to all buttons
            document.querySelectorAll('.year-button, .disease-button, .state-button').forEach(button => {
                button.addEventListener('click', handleButtonClick);
            });

            // Dat GUI 
            const options = {
                rotateGlobe: false,
                globeRotationSpeed: 0.25,
                heatmapVisible: true,
                pointsVisible: true,
            }

            const gui = new dat.GUI({ name: 'Visualization Options', autoPlace: true });
            document.getElementById('guiContainer').appendChild(gui.domElement);
            const globeControls = gui.addFolder('Globe Options');
            globeControls.open();

            // Rotate Globe Control
            globeControls
                .add(options, "rotateGlobe")
                .name("Rotate Globe")
                .onChange((e) => {
                    world.controls().autoRotate = e;
                    options.rotateGlobe = e;
                });

            // Rotate Globe Speed Control
            globeControls
                .add(options, "globeRotationSpeed", -2, 2, 0.05)
                .name("Rotation Speed")
                .onChange((e) => {
                    world.controls().autoRotateSpeed = e;
                    options.globeRotationSpeed = e;
                });

            // Show/Hide Heatmap
            globeControls
                .add(options, "heatmapVisible")
                .name("Heatmap")
                .onChange((e) => {
                    if (e) {
                        world.heatmapsData([transformedDataset]);
                    } else {
                        world.heatmapsData([]);
                    }
                });

            // Show/Hide Points
            globeControls
                .add(options, "pointsVisible")
                .name("Points")
                .onChange((e) => {
                    if (e) {
                        world.pointsData(pointsData);
                    } else {
                        world.pointsData([]);
                    }
                });

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    initGlobe();
});