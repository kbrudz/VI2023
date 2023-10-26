// Declare a variable to hold the loaded JSON data.
let globalDelays, globalTemp;

const globalRegions = ["west", "south", "midwest", "northeast"];
let activeRegions = [...globalRegions];
let timeRange = [1, 31];

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

document.addEventListener('mousemove', moveTooltip, false);

function moveTooltip(e) {
    d3.select('#tooltip')
        .style("left", (e.pageX) + 10 + "px")
        .style("top", (e.pageY - 20) + "px");
}

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
function updateIdioms(data = 'none') {
    if(data === 'all') {
        // all regions become active
        activeRegions = [...globalRegions];
    } else if(data !== 'none') {
        // if all regions are active
        if(globalRegions.every(d => activeRegions.includes(d)))
            // the only active region becomes the selected
            activeRegions = [data];
        // if the selected region is already active
        else if(activeRegions.includes(data)) {
            // deselect region
            activeRegions.splice(activeRegions.findIndex(d => d == data), 1);
            // if no region is active -> select all regions
            if(activeRegions.length === 0) activeRegions = [...globalRegions];
        // if the region is not yet active
        } else activeRegions.push(data);
    }

    updateParallel(globalDelays.filter((d) => 
        activeRegions.includes(stateToRegion[d.ORIGIN_STATE])
    ));
    
    updateStream(globalDelays.filter((d) => 
        activeRegions.includes(stateToRegion[d.ORIGIN_STATE])
    ), globalTemp.filter((d) => 
        activeRegions.includes(stateToRegion[d.iso_region])
    ));

    updateChordDiagram(globalDelays.filter((d) => 
        activeRegions.includes(stateToRegion[d.ORIGIN_STATE]) ||
        activeRegions.includes(stateToRegion[d.DEST_STATE])
    ));
}

function updateTimeRange(range) {
    updateParallel(globalDelays.filter((d) => 
        activeRegions.includes(stateToRegion[d.ORIGIN_STATE]) &&
        (timeRange[0] <= +d.FL_DATE.slice(-2) <= timeRange[1])
    ));
    updateChordDiagram(globalDelays.filter((d) => 
        (activeRegions.includes(stateToRegion[d.ORIGIN_STATE]) || activeRegions.includes(stateToRegion[d.DEST_STATE])) &&
        (timeRange[0] <= +d.FL_DATE.slice(-2) <= timeRange[1])
    ));
}

function updateTempUnit(unit) {
    tempUnit = unit;
    var legend = [[20,1],[0,1],[-10,1]];
    var xLegend = d3.scaleBand()
        .range([ 0, 100 ])
        .domain(legend.map(d => d[0]))
        .padding(0.2);
    const svgLegend = d3.select(".legend");
    // console.log(svgLegend);
    //create domain for color scale for Fahrenheit 	.range(["#00008B", "#ffffff", "#8B0000"]) .domain([15,35,55])
    let tickLabelsC = ["20ºC", "0ºC", "-10ºC"];
    let tickLabelsF = ["68ºF", "32ºF", "14ºF"];
    if (unit == "C")
	    svgLegend.call(d3.axisBottom(xLegend).ticks(3).tickFormat((d,i) => tickLabelsC[i]))
    else if (unit == "F")
	    svgLegend.call(d3.axisBottom(xLegend).ticks(3).tickFormat((d,i) => tickLabelsF[i]))
}







