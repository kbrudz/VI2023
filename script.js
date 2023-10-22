// Declare a variable to hold the loaded JSON data.
let globalDelays, globalTemp;
    
const globalRegions = ["west", "south", "midwest", "northeast"];
let selectedRegions = [...globalRegions];

// // Define margins for the visualizations. 
// const margin = {top: 30, right: 10, bottom: 10, left: 0};

// // Calculate the width and height of the visualizations based on the margins.
// const width = 1800 - margin.left - margin.right,
//     widthParallel = 1800 - margin.left - margin.right,
//     height = 380 - margin.top - margin.bottom;
// Define margins for the visualizations. 
const margin = { top: 20, right: 20, bottom: 50, left: 50 };

// Calculate the width and height of the visualizations based on the margins.
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const widthParallel = 1800 - margin.left - margin.right;

// This function initiates the dashboard and loads the JSON data.
function startDashboard() {
    // Load the both CSV files using D3.csv
    Promise.all([
        d3.csv("./december_delays.csv"),
        d3.csv("./december_temperatures.csv"),
    ]).then(function(files) {
        // files[0] will contain december_delays.csv and files[1] will contain december_temperatures.csv
        // Once the data is loaded successfully, store it in the globalData variable.
        globalDelays = files[0];
        globalTemp = files[1];
        // Create different visualizations using the loaded data.
        createParallelCoords(files[0], files[1]);
        createStreamGraph(files[0], files[1]);
        createChordDiagram(files[0], files[1]);
        // createLineChart(data1, data2);
        // createHistogram(data1, data2);
    }).catch(function(err) {
        // If there's an error while loading the JSON data, log the error.
        console.error("Error loading the CSV file:", err);
    })

}

// This function updates the visualizations based on the selected data type.
function updateIdioms(data) {
    // console.log(data);
    // if (data != "all"){
    //     updateParallel(globalDelays.filter((d) => stateToRegion[d.ORIGIN_STATE] === data));
    //     updateStream(globalDelays.filter((d) => stateToRegion[d.ORIGIN_STATE] === data), globalTemp.filter((d) => stateToRegion[d.iso_region] === data));
    //     updateChordDiagram(globalDelays.filter((d) => stateToRegion[d.ORIGIN_STATE] === data || stateToRegion[d.DEST_STATE] === data));
    // }else{
    //     updateParallel(globalDelays);
    //     updateStream(globalDelays, globalTemp);
    //     updateChordDiagram(globalDelays);
    if(data === 'all') {
        selectedRegions = [...globalRegions];
    } else {
        if(globalRegions.every(d => selectedRegions.includes(d)))
            selectedRegions = [data];
        else if(selectedRegions.includes(data)) {
            selectedRegions.splice(selectedRegions.findIndex(d => d == data), 1);
            if(selectedRegions.length === 0) {console.log("emptied");selectedRegions = [...globalRegions];}
        } else selectedRegions.push(data);
    }
    
    console.log(selectedRegions);

    updateParallel(globalDelays.filter((d) => selectedRegions.includes(stateToRegion[d.ORIGIN_STATE])));
    updateStream(globalDelays.filter((d) => selectedRegions.includes(stateToRegion[d.ORIGIN_STATE])), globalTemp.filter((d) => selectedRegions.includes(stateToRegion[d.iso_region])));
    updateChordDiagram(globalDelays.filter((d) => selectedRegions.includes(stateToRegion[d.ORIGIN_STATE]) || selectedRegions.includes(stateToRegion[d.DEST_STATE])));
}
