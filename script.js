// Declare a variable to hold the loaded JSON data.
var globalDelays, globalTemp, globalRegions;

// Define margins for the visualizations. 
const margin = {top: 30, right: 10, bottom: 10, left: 0};

// Calculate the width and height of the visualizations based on the margins.
const width = 600 - margin.left - margin.right,
    widthParallel = 1200 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

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
        selectedRegions = ["west", "south", "midwest", "northeast"];
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

// // This function updates the visualizations based on the selected data type.
function updateIdioms(data) {

  // Use a switch statement to check which data type is selected.
  switch (data) {
    case "west":
        // If "old" is selected, update the visualizations with data before or equal to 2010.
        updateParallel(globalDelays.filter((item) => stateToRegion[item.ORIGIN_STATE] === "west"));
        break;
    case "south":
//       // If "new" is selected, update the visualizations with data after 2010.
        updateParallel(globalDelays.filter((item) => stateToRegion[item.ORIGIN_STATE] === "south"));
        break;
    case "midwest":
        // If "old" is selected, update the visualizations with data before or equal to 2010.
        updateParallel(globalDelays.filter((item) => stateToRegion[item.ORIGIN_STATE] === "midwest"));
        break;
    case "northeast":
//       // If "new" is selected, update the visualizations with data after 2010.
        updateParallel(globalDelays.filter((item) => stateToRegion[item.ORIGIN_STATE] === "northeast"));
        break;
    default:
//       // If no specific data type is selected, update the visualizations with all the data.
        updateParallel(globalDelays);
        break;
  }
}
