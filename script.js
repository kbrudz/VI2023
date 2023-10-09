// Declare a variable to hold the loaded JSON data.
var globalDelays, globalTemp;

// Define margins for the visualizations. 
const margin = { top: 20, right: 20, bottom: 50, left: 80 };

// Calculate the width and height of the visualizations based on the margins.
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

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
        // createLineChart(data1, data2);
        // createHistogram(data1, data2);
    }).catch(function(err) {
        // If there's an error while loading the JSON data, log the error.
        console.error("Error loading the CSV file:", err);
    })

}

// // This function updates the visualizations based on the selected data type.
// function updateIdioms(data) {
//   // Use a switch statement to check which data type is selected.
//   switch (data) {
//     case "old":
//       // If "old" is selected, update the visualizations with data before or equal to 2010.
//       updateBarChart(globalData.filter((item) => item.oscar_year <= 2010));
//       updateScatterPlot(globalData.filter((item) => item.oscar_year <= 2010));
//       updateLineChart(globalData.filter((item) => item.oscar_year <= 2010));
//       updateHistogram(globalData.filter((item) => item.oscar_year <= 2010));
//       break;
//     case "new":
//       // If "new" is selected, update the visualizations with data after 2010.
//       updateBarChart(globalData.filter((item) => item.oscar_year > 2010));
//       updateScatterPlot(globalData.filter((item) => item.oscar_year > 2010));
//       updateLineChart(globalData.filter((item) => item.oscar_year > 2010));
//       updateHistogram(globalData.filter((item) => item.oscar_year > 2010));
//       break;
//     default:
//       // If no specific data type is selected, update the visualizations with all the data.
//       updateBarChart(globalData);
//       updateScatterPlot(globalData);
//       updateLineChart(globalData);
//       updateHistogram(globalData);
//       break;
//   }
// }
