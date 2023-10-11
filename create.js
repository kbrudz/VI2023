 const regions = {"US-WA":"west","US-OR":"west","US-ID":"west","US-MT":"west","US-WY":"west","US-CA":"west",
	"US-NV":"west","US-UT":"west","US-CO":"west","US-AK":"west","US-HI":"west","US-AZ":"west","US-NM":"west",
	"US-AR":"south","US-LA":"south","US-TX":"south","US-OK":"south","US-MS":"south","US-AL":"south",
	"US-GA":"south","US-FL":"south","US-SC":"south","US-NC":"south","US-TN":"south","US-KY":"south",
	"US-WV":"south","US-VA":"south","US-DC":"south","US-DE":"south","US-MD":"south",
	"US-ND":"midwest","US-SD":"midwest","US-NE":"midwest","US-KS":"midwest","US-MN":"midwest",
	"US-IA":"midwest","US-MO":"midwest","US-WI":"midwest","US-IL":"midwest","US-MI":"midwest",
	"US-IN":"midwest","US-OH":"midwest",
	"US-PA":"northeast","US-NY":"northeast","US-VT":"northeast","US-NH":"northeast","US-MA":"northeast",
	"US-CT":"northeast","US-ME":"northeast","US-NJ":"northeast","US-RI":"northeast"
}
const colorRegion = {"west":"#F5C225", "south":"#5872F5", "midwest":"#75C700", "northeast":"#F53A29"}

// Function to create a bar chart
function createStreamGraph(delays, temp) {
    // Select the #streamGraph element and append an SVG to it
    console.log('here1');

	// All of these are different ways of formatting the data in an attempt to make it fit for the area chart
	const filteredData = delays.filter(function (d) {
		return (
			d.DEP_DELAY !== '' &&
			d.FL_DATE !== '' &&
			d.ORIGIN_AIRPORT !== ''
		);
	});
	const total_delays = d3.rollups(filteredData, 
		v => d3.sum(v, d => {
			if (d.DEP_DELAY >= 0)
				return d.DEP_DELAY;
			else return 0;
		}), 
		d => d.FL_DATE, d => d.ORIGIN_AIRPORT);

	// console.log("total delays: ", total_delays);
    const data = [...total_delays].flatMap(([k1, v1]) => [...v1].map(([k2, v2]) => ({date: k1, airport: k2, delay: v2})))
	// list of unique airport names
	const unique_airports = d3.union(data.map(d => d.airport)) 
    
	const aux = new Map();
	var i = 0;
	data.forEach(d => {
        aux.set(i,  {
			date: d.date,
			[d.airport]: Math.abs(d.delay)
		});
		i++;
    });
    const new_data = Array.from(aux, ([key, value]) => value);
  
    // Create an object to store the data for each airport
    const airportData = {};
    unique_airports.forEach(airport => {
        airportData[airport] = [];
    });
    // Group data by date and airport and sum the delays
    data.forEach(d => {
		airportData[d.airport].push({
			[d.date]: d.date,
			delay: Math.abs(d.delay)
		});
    });

	const aggregatedData = d3.rollups(
		delays,
		group => ({
			delay: (d3.mean(group, d => +d.DEP_DELAY) + d3.mean(group, d => d.ARR_DELAY))/2,
			date: group[0].DEP_DELAY
		}),
		d => d.ORIGIN_AIRPORT
	);

    // set the dimensions and margins of the graph
	var margin = {top: 20, right: 30, bottom: 30, left: 60},
	width = 460 - margin.left - margin.right,
	height = 400 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	var svg = d3.select("#streamGraph")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
		"translate(" + margin.left + "," + margin.top + ")");

	// Add X axis
	var x = d3.scaleLinear()
		.domain(d3.extent(new_data, function(d) { return d.date; }))
		.range([ 0, width ]);
		svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x).ticks(5));

	// Add Y axis
	var y = d3.scaleLinear()
		.domain([-100000, 100000])
		.range([ height, 0 ]);
		svg.append("g")
		.call(d3.axisLeft(y));

	// color palette
	var color = d3.scaleOrdinal()
		.domain(unique_airports)
		.range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf'])

	//stack the data?
	var stackedData = d3.stack()
		.offset(d3.stackOffsetSilhouette)
		.keys(unique_airports)
		(new_data)

	// Show the areas
	svg
	.selectAll("mylayers")
	.data(stackedData)
	.enter()
	.append("path")
	.style("fill", function(d) { return color(d.key); })
	.attr("d", d3.area()
		.x(function(d, i) { return x(d.date); })
		.y0(function(d) { return y(d[0]); })
		.y1(function(d) { return y(d[1]); })
	)

    console.log('here?last');
}

function createParallelCoords(delays, temp){
      // set the dimensions and margins of the graph
    const margin = {top: 30, right: 10, bottom: 10, left: 0},
    width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select("#parallelCoords")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",`translate(${margin.left},${margin.top})`);
	console.log("delays :",delays);
	// Group the data by ORIGIN_AIRPORT and calculate the sums and means
	const aggregatedData = d3.rollup(
		delays,
		group => ({
			DEP_DELAY_SUM: d3.sum(group, d => d.DEP_DELAY),
			ARR_DELAY_SUM: d3.sum(group, d => d.ARR_DELAY),
			CANCELLED_MEAN: d3.mean(group, d => d.CANCELLED),
			DIVERTED_MEAN: d3.mean(group, d => d.DIVERTED),
			ORIGIN_TYPE: group[0].ORIGIN_TYPE, // Assuming it's the same for all entries of the same airport
			ORIGIN_STATE: group[0].ORIGIN_STATE, // Assuming it's the same for all entries of the same airport
			ORIGIN: group[0].ORIGIN, // Assuming it's the same for all entries of the same airport
			AIRPORT_ELEVATION: Number(group[0].ORIGIN_ELEVATION)
		}),
		d => d.ORIGIN_AIRPORT
	);
		console.log(aggregatedData);
	// Convert the aggregated data back to an array for visualization
	const formattedData = Array.from(aggregatedData, ([key, value]) => ({ ORIGIN_AIRPORT: key, ...value }));
	console.log(formattedData);

	// Create a scale for each attribute (column)
	const scales = {};
	const attributes = ["DEP_DELAY_SUM", "ARR_DELAY_SUM", "CANCELLED_MEAN", "DIVERTED_MEAN", "AIRPORT_ELEVATION"];
	attributes.forEach(attribute => {
		scales[attribute] = d3.scaleLinear()
			.domain([d3.max(d3.extent(formattedData, d => d[attribute])), d3.min(d3.extent(formattedData, d => d[attribute]))])
			.range([0, height]);
		if (attribute == "CANCELLED_MEAN" || attribute == "DIVERTED_MEAN")
		scales[attribute] = d3.scaleLinear()
			.domain([1,0])
			.range([0, height]);
	});
	

	// Define your axes
	const axes = attributes;
	// Build the X scale -> it find the best position for each Y axis
	x = d3.scalePoint()
		.range([0, width])
		.padding(1)
		.domain(axes);

	function path(d) {
		return d3.line()(axes.map(function(p) { return [x(p), scales[p](d[p])]; }));
	}

	// Highlight the specie that is hovered
	var highlight = function(d){
		// first every group turns grey
		d3.selectAll(".line")
		  .transition().duration(200)
		  .style("stroke", "lightgrey")
		  .style("opacity", "0.2");
		// Second the hovered specie takes its color
		d3.selectAll(".line." + d.ORIGIN)
		  .transition().duration(200)
		  .style("stroke", colorRegion[regions[d.ORIGIN_STATE]])
		  .style("opacity", "1");
	  }
	// Unhighlight
	var unhighlight = function(d){
		d3.selectAll(".line")
			.transition().duration(200).delay(300)
			.style("stroke", (d) => colorRegion[regions[d.ORIGIN_STATE]])
			.style("opacity", "1")
	}

	// Create the parallel coordinates lines
	svg.selectAll(".line")
		.data(formattedData)
		.enter()
    	.append("path")
		.attr("class", function (d) { return "line " + d.ORIGIN } ) //
		.attr("d", path)
		.style("stroke", (d) => colorRegion[regions[d.ORIGIN_STATE]])
		.style("stroke-width", 1)
		.style("fill", "none")
		.on("mouseover", highlight)
     	.on("mouseleave", unhighlight );

	// Add axes
	svg.selectAll(".axis")
		.data(axes).enter()
		.append("g")
		.attr("class", "axis")
		.attr("transform", (d, i) => "translate(" + x(d) + ")")
		.each(function(d) {
			d3.select(this).call(d3.axisLeft().scale(scales[d]));
		})
		// Add axis title
		.append("text")
		  .style("text-anchor", "middle")
		  .attr("y", -9)
		  .text(function(d) { return d; })
		  .style("fill", "black");
	
	// Add labels for ORIGIN_AIRPORT
	svg.selectAll(".axis")
		.filter(d => d === "ORIGIN_AIRPORT")
		.selectAll("text")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end");
}

  
  