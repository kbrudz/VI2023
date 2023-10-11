const stateToRegion = {
	//West
	"US-WA":"west","US-OR":"west","US-ID":"west","US-MT":"west","US-WY":"west","US-CA":"west","US-NV":"west",
	"US-UT":"west", "US-CO":"west","US-AK":"west","US-HI":"west","US-AZ":"west","US-NM":"west",
	//South
	"US-AR":"south","US-LA":"south","US-TX":"south","US-OK":"south","US-MS":"south","US-AL":"south",
	"US-GA":"south","US-FL":"south","US-SC":"south","US-NC":"south","US-TN":"south","US-KY":"south",
	"US-WV":"south","US-VA":"south","US-DC":"south","US-DE":"south","US-MD":"south",
	//Midwest
	"US-ND":"midwest","US-SD":"midwest","US-NE":"midwest","US-KS":"midwest","US-MN":"midwest","US-IA":"midwest",
	"US-MO":"midwest","US-WI":"midwest","US-IL":"midwest","US-MI":"midwest","US-IN":"midwest","US-OH":"midwest",
	//Northeast
	"US-PA":"northeast","US-NY":"northeast","US-VT":"northeast","US-NH":"northeast","US-MA":"northeast",
	"US-CT":"northeast","US-ME":"northeast"
}

const regionColors = { "west":"blue", "south":"red", "midwest":"green", "northeast":"yellow" }

// Function to create a bar chart
function createStreamGraph(delays, temp) {
    // Select the #streamGraph element and append an SVG to it
    console.log('here1');

	// All of these are different ways of formatting the data in an attempt to make it fit for the area chart
	const delaysFiltered = delays.filter(
		d => (d.DEP_DELAY !== '' && d.FL_DATE !== '' && d.ORIGIN_STATE !== '')
	);

	const delaysPerDate = d3.rollups(delaysFiltered, 
		v => d3.sum(v, d => Math.max(d.DEP_DELAY, 0)), 
		d => d3.timeParse("%Y-%m-%d")(d.FL_DATE),  
		d => stateToRegion[d.ORIGIN_STATE]
	).flatMap(
		([k1, v1]) => [...v1].map(([k2, v2]) => ({date: k1, region: k2, delay: v2}))
	);

	//console.log("total delays: ", delaysPerDate);

	/*
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
	*/

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
	var xScale = d3.scaleLinear()
		.domain(d3.extent(delaysPerDate, d => d.date))
		.range([ 0, width ]);
		svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(xScale).ticks(5));

	// Add Y axis
	var yScale = d3.scaleLinear()
		.domain([0, 100000])
		.range([ height, 0 ]);
		svg.append("g")
		.call(d3.axisLeft(yScale));

	//stack the data?
	var stackedData = d3.stack()
		.offset(d3.stackOffsetSilhouette)
		.keys(["west","south","midwest","northeast"])(delaysPerDate)

	/*
	// Show the areas
	svg
	.selectAll("mylayers")
	.data(stackedData)
	.enter()
	.append("path")
	.style("fill", d => regionColors[d.region])
	.attr("d", d3.area()
		.x(function(d, i) { return xScale(d.date); })
		.y0(yScale(0))
		.y1( d=> yScale(d[1]) )
	)
	*/
	
	// Add the area
    svg.append("path")
      .datum(delaysPerDate)
      .attr("fill", "steelblue")
      .attr("d", d3.area()
        .x(function(d) { return xScale(d.date) })
        .y0(yScale(0))
        .y1(function(d) { return yScale(d.delay) })
      )
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
	console.log(delays);
	// Group the data by ORIGIN_AIRPORT and calculate the sums and means
	const aggregatedData = d3.rollup(
		delays,
		group => ({
			DEP_DELAY_SUM: d3.sum(group, d => d.DEP_DELAY),
			ARR_DELAY_SUM: d3.sum(group, d => d.ARR_DELAY),
			CANCELLED_MEAN: d3.mean(group, d => d.CANCELLED),
			DIVERTED_MEAN: d3.mean(group, d => d.DIVERTED),
			ORIGIN_TYPE: group[0].ORIGIN_TYPE, // Assuming it's the same for all entries of the same airport
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

	// function colorRegion(d){
	// 	regions.forEach(d => {
	// 		if d.
	// 	})
	// }
	// Create the parallel coordinates lines
	svg.selectAll(".line")
		.data(formattedData)
		.enter()
    	.append("path")
		.attr("class", "line data")
		.attr("d", path)
		// d => {
		// 	return d3.line()(axes.map(axis => [scales[axis](d[axis]), height]));
		// })
		.style("stroke", "gray")
		.style("stroke-width", 1)
		.style("fill", "none");

	// Add axes
	svg.selectAll(".axis")
		.data(axes)
		.enter().append("g")
		.attr("class", "axis")
		.attr("transform", (d, i) => "translate(" + x(d) + ")")
		.each(function(d) {
			d3.select(this).call(d3.axisLeft().scale(scales[d]));
		});

	// Add labels for ORIGIN_AIRPORT
	svg.selectAll(".axis")
		.filter(d => d === "ORIGIN_AIRPORT")
		.selectAll("text")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end");
}


function createChordDiagram(delays,regions) {
    console.log('Inside createChordDiagram:', delays, regions);

	    // Obliczenie rozmiarów SVG
    const svgWidth = 600;
    const svgHeight = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Ustalenie promienia wewnętrznego i zewnętrznego diagramu Chord
    const outerRadius = Math.min(width, height) * 0.5 - 40;
    const innerRadius = outerRadius - 30;

    const svg = d3
      .select("#ChordDiagram")
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

	const total_delays = d3.rollup(
		delays,
		(v) => d3.sum(v, (d) => +d.DEP_DELAY), // Sum of departure delays
		(d) => d.ORIGIN_STATE,
		(d) => d.DEST_STATE
	  );
	const delayed = Array.from(total_delays, ([date, originState, destState, delay]) => {
		if (originState && destState) {
		  return {
			date,
			originState,
			destState,
			delay,
		  };
		}
		return null; // Lub możesz zdecydować, co zrobić z nieprawidłowymi danymi.
	  }).filter((data) => data !== null); 
	  

    // Get unique states as regions
	const uniqueRegions = Array.from(new Set([...total_delays.keys()]));
	const matrix = uniqueRegions.map((originState) =>
	  uniqueRegions.map((destState) => total_delays.get(originState)?.get(destState) || 0)
	);
    delayed.forEach((d) => {
      const i = uniqueRegions.indexOf(d.originState);
      const j = uniqueRegions.indexOf(d.destState);
	  if (i !== -1 && j !== -1) {
		matrix[i][j] += d.delay;
	  } else {
		console.log(`Invalid indices for originState: ${d.originState} and destState: ${d.destState}`);
	  }
	});

    const chord = d3
      .chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending)
      (matrix);

    const arc = d3.arc()
      .innerRadius(200)
      .outerRadius(210);

    const ribbon = d3.ribbon()
      .radius(200)
      .padAngle(0.05)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle)
      .source((d) => d.source)
      .target((d) => d.target)
      .radius(200);

    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .selectAll("stop")
      .data(chord)
      .join("stop")
      .attr("offset", (d) => Math.round(d.source.startAngle * 100) / 100)
      .attr("stop-color", (d) => d3.interpolateSpectral(d.source.index / 10));

    svg
      .datum(chord)
      .append("g")
      .selectAll("path")
      .data((d) => d)
      .join("path")
      .attr("d", ribbon)
      .attr("fill", "url(#gradient)")
      .attr("stroke", "black")
      .style("stroke-width", "0.5px")
      .style("opacity", 0.7);

    // Add the groups on the outer part of the circle
    svg
      .datum(chord)
      .append("g")
      .selectAll("g")
      .data((d) => d.groups)
      .join("g")
      .append("path")
      .attr("fill", (d) => {
        const state = uniqueRegions[d.index];
        return getRegionColor(state);
      })
      .attr("stroke", "black")
      .attr("d", arc)
      .style("stroke-width", "0.5px")
      .style("opacity", 0.7);

    // Add the labels
    svg
      .datum(chord)
      .append("g")
      .selectAll("g")
      .data((d) => d.groups)
      .join("g")
      .append("text")
      .attr("x", 6)
      .attr("dy", 15)
      .append("textPath")
      .attr("href", "#gradient")
      .text((d) => {
        const state = uniqueRegions[d.index];
        return state;
      })
      .attr("font-size", "12px")
      .attr("fill", "black")
      .style("opacity", 0.7);

    svg
      .append("text")
      .attr("x", 0)
      .attr("y", -160)
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Chord Diagram of Delays Between Regions")
      .attr("fill", "black")
      .style("opacity", 0.7);

    svg
      .append("text")
      .attr("x", 0)
      .attr("y", -130)
      .attr("font-size", "15px")
      .attr("text-anchor", "middle")
      .text("December 2015")
      .attr("fill", "black")
      .style("opacity", 0.7);

    const size = 20;
    svg
      .selectAll("mydots")
      .data(Object.values(regions))
      .join("rect")
      .attr("x", 100)
      .attr("y", (d, i) => 100 + i * (size + 5))
      .attr("width", size)
      .attr("height", size)
      .style("fill", (d) => Array.isArray(d[0]) ? d[0][0] : d[0])
      .style("opacity", 0.7);

    svg
      .selectAll("mylabels")
      .data(Object.values(regions))
      .join("text")
      .attr("x", 100 + size * 1.2)
      .attr("y", (d, i) => 100 + i * (size + 5) + size / 2)
      .style("fill", (d) => Array.isArray(d[0]) ? d[0][0] : d[0])
      .text((d) => Array.isArray(d[1]) ? (d[1].map(subArr => subArr[0]).join(", ")) : "")
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
      .attr("font-size", "15px")
      .style("opacity", 0.7);

    svg
      .append("text")
      .attr("x", 0)
      .attr("y", 160)
      .attr("font-size", "15px")
      .attr("text-anchor", "middle")
      .text("Source: Bureau of Transportation Statistics")
      .attr("fill", "black")
      .style("opacity", 0.7);
	  console.log();
  }

  function getRegionColor(state) {
	for (const region in globalRegions) {
	  if (Object.hasOwnProperty.call(globalRegions, region)) {
		const regionStates = globalRegions[region][1];
		if (Array.isArray(regionStates) && regionStates.includes(state)) {
		  return globalRegions[region][0];
		}
	  }
	}
	return "gray";
  }
  
  