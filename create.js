//exploring interactivity for parallel coords
var dragging = {},
    foreground,
    background,
    highlighted,
    dimensions,                           
    legend,
    brush_count = 0,
    excluded_groups = [];

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
	"US-CT":"northeast","US-ME":"northeast", "US-NJ":"northeast","US-RI":"northeast"
}

const regionColors = {"west":"#F5C225", "south":"#5872F5", "midwest":"#75C700", "northeast":"#F53A29"}

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

	
	// // list of unique airport names
	// const unique_airports = d3.union(data.map(d => d.airport)) 

	// const aux = new Map();
	// var i = 0;
	// data.forEach(d => {
    //     aux.set(i,  {
	// 		date: d.date,
	// 		[d.airport]: Math.abs(d.delay)
	// 	});
	// 	i++;
    // });
    // const new_data = Array.from(aux, ([key, value]) => value);
  
    // // Create an object to store the data for each airport
    // const airportData = {};
    // unique_airports.forEach(airport => {
    //     airportData[airport] = [];
    // });
    // // Group data by date and airport and sum the delays
    // data.forEach(d => {
	// 	airportData[d.airport].push({
	// 		[d.date]: d.date,
	// 		delay: Math.abs(d.delay)
	// 	});
    // });

	// const aggregatedData = d3.rollups(
	// 	delays,
	// 	group => ({
	// 		delay: (d3.mean(group, d => +d.DEP_DELAY) + d3.mean(group, d => d.ARR_DELAY))/2,
	// 		date: group[0].DEP_DELAY
	// 	}),
	// 	d => d.ORIGIN_AIRPORT
	// );
	

    // set the dimensions and margins of the graph
	// var margin = {top: 30, right: 10, bottom: 10, left: 10}
    const margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = 600 - margin.left - margin.right,
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

	// TODO: 
	// Highlight regions ?
	// DONEx -> MAS NOT REALLY broken BRUSH fix update
	// DONE tooltip with name
	// DONE fix grid layout based on lab4

      // set the dimensions and margins of the graph
    const margin = {top: 30, right: 30, bottom: 10, left: 0},
    width = 1800 - margin.left - margin.right,
    height = 380 - margin.top - margin.bottom;

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

	// Define your dimensions
	const dimensions = ["DEP_DELAY_SUM", "ARR_DELAY_SUM", "CANCELLED_MEAN", "DIVERTED_MEAN", "AIRPORT_ELEVATION"];
	origDimensions = dimensions.slice(0);
	const y = {};
	dimensions.forEach(dim => {
		y[dim] = d3.scaleLinear()
			.domain([d3.max(d3.extent(formattedData, d => d[dim])), d3.min(d3.extent(formattedData, d => d[dim]))])
			.range([0, height]);
		if (dim == "CANCELLED_MEAN" || dim == "DIVERTED_MEAN")
		y[dim] = d3.scaleLinear()
			.domain([1,0])
			.range([0, height]);
	});

	extents = dimensions.map(function(p) { return [0,0]; });

	var x = d3.scalePoint().rangeRound([0, width]).padding(1).domain(dimensions),
		line = d3.line(),
		dragging = {},
		background,
		foreground,
		origDimensions;

	var svg = d3.select("#parallelCoords").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Add grey background lines for context.
	background = svg.append("g")
		.attr("class", "background")
		.selectAll("path")
		.data(formattedData)
		.enter().append("path")
		.attr("d", path);
	// Add blue foreground lines for focus.
	foreground = svg.append("g")
		.attr("class", "foreground")
		.selectAll("path")
		.data(formattedData)
		.enter().append("path")
		.attr("class", (d) => d.ORIGIN)
		.attr("d", path)
		.style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
		.style("stroke-width", 1)
		.style("fill", "none")
		// .on("mouseover", handleMouseOver) // Functi
		.on("mouseover", (event, d)=>{ showTooltip(event, d)})
		// .on("mouseover.second", (event, d)=>{ highlight(event, d)})
		.on("mouseout", hideTooltip) // Functi
		// .on("mouseout.second", unhighlight)
		;
	// Add a group element for each dimension.
	console.log("dim: ",dimensions);
	var g = svg.selectAll(".dimension")
		.data(dimensions)
		.enter().append("g")
		.attr("class", "dimension")
		.attr("transform", function(d) { return "translate(" + x(d) + ")"; })
		.call(d3.drag()
			.subject(function(d) { return {x: x(d)}; })
			.on("start", function(d) {
				dragging[d] = x(d);
				// background.attr("visibility", "hidden");
			})
			.on("drag", function(event, d) {
				dragging[d] = Math.min(width, Math.max(0, event.x));
				foreground.attr("d", path);
				background.attr("d", path);
				dimensions.sort(function(a, b) { 
					return position(a) - position(b); 
				});
				x.domain(dimensions);
				g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
				console.log("dragging")
			})
			.on("end", function(d) {
				delete dragging[d];
				// transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
				transition(foreground).attr("d", path);
				transition(foreground).attr("d", path);
				// background
				// 	.attr("d", path)
				//   	.transition()
				// 	.delay(500)
				// 	.duration(0)
				// 	.attr("visibility", null);
					
					var new_extents = [];
					for(var i=0;i<dimensions.length;++i){
						new_extents.push(extents[origDimensions.indexOf(dimensions[i])]);
					  }
					  extents = new_extents;
					  origDimensions = dimensions.slice(0);
			}));
		// Add an axis and title.
		var g = svg.selectAll(".dimension");
		g.append("g")
			.attr("class", "axis")
			.each(function(d) {  d3.select(this).call(d3.axisLeft(y[d]));})
			//text does not show up because previous line breaks somehow
			.append("text")
			.attr("fill", "black")
			.style("text-anchor", "middle")
			.attr("y", -9) 
			.text(function(d) { return d; });

		// Add and store a brush for each axis.
		g.append("g")
			.attr("class", "brush")
			.each(function(d) {
				console.log("brush?: ", y[d].name);
				if(y[d].name == 'scale'){
				// console.log(this);
				d3.select(this)
					.call(y[d].brush = d3.brushY()
						.extent([[-8, 0], [8,height]])
						.on("start", brushstart)
						.on("brush", brushing))
						.on("end", brushend);
				}
			})
			.selectAll("rect")
			.attr("x", -8)
			.attr("width", 16);  

	// TODO: Highlight the specie that is hovered
	function highlight (event, d){
		console.log("highlight", d);
		// first every group turns grey
		d3.selectAll(".foreground")
		  .transition().duration(200)
		  .style("stroke", "lightgrey")
		  .style("opacity", "0.2");
		// Second the hovered specie takes its color
		d3.select("." + d.ORIGIN)
		  .transition().duration(200)
		  .style("stroke", regionColors[stateToRegion[d.ORIGIN_STATE]])
		  .style("opacity", "1");
	  }
	// Unhighlight
	function unhighlight(d){
		console.log("unhighlight", d.ORIGIN);
		d3.selectAll(".foreground")
			.transition().duration(200).delay(10000)
			.style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
			.style("opacity", "1")
	}
	// Returns the path for a given data point.
	function path(d) {
		return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
	}
	function position(d) {
		var v = dragging[d];
		return v == null ? x(d) : v;
	}
	function transition(g) {
		return g.transition().duration(500);
	}
	
	// Handles a brush event, toggling the display of foreground lines.
	function brushstart(event) {
		event.sourceEvent.stopPropagation();  
	}
	function brushing(event) {
		for(var i=0;i<dimensions.length;++i){
			if(event.target==y[dimensions[i]].brush) {
				  extents[i]=event.selection.map(y[dimensions[i]].invert,y[dimensions[i]]);
				  }
		}
		foreground.style("display", function(d) {
			return dimensions.every(function(p, i) {
				if(extents[i][0]==0 && extents[i][0]==0) {
					return true;
				}
			return extents[i][1] <= d[p] && d[p] <= extents[i][0];
			}) ? null : "none";
		}); 
	}
	function brushend(event) {
		if (event.defaultPrevented) return; // click suppressed
	}
}
function createChordDiagram(delays, temp) {


    console.log('Inside createChordDiagram:', delays, temp);

    const svgWidth = 500;
    const svgHeight = 440;
    const margin = { top: 10, right: 10, bottom: 10, left: 0 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const outerRadius = svgWidth * 0.25 - 40;
    const innerRadius = outerRadius - 30;

    const svg = d3
        .select("#chordDiagram")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${width / 2},${(height+width) / 4})`);

    const total_delays = d3.rollup(
        delays,
        (v) => d3.sum(v, (d) => +d.DEP_DELAY),
        (d) => d.ORIGIN_STATE,
        (d) => d.DEST_STATE
    );

    const delayed = Array.from(total_delays, ([originState, destState, delay]) => {
        if (originState && destState) {
            return {
                originState,
                destState,
                delay,
            };
        }
        return null;
    }).filter((data) => data !== null);

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

    svg
        .datum(chord)
        .append("g")
        .selectAll("g")
        .data((d) => d.groups)
        .join("g")
        .append("path")
        .attr("fill", (d) => {
            const state = uniqueRegions[d.index];
            const region = stateToRegion[state];
            return regionColors[region];
        })
        .attr("stroke", "black")
        .attr("d", arc)
        .style("stroke-width", "0.5px")
        .style("opacity", 0.7);

    // Dodaj etykiety
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

		//add legend and title
		
	// const size = 20;
	// const xOffset = 185; 
	
	// svg
	// 	.selectAll("mydots")
	// 	.data(Object.values(regionColors))
	// 	.join("rect")
	// 	.attr("x", xOffset) 
	// 	.attr("y", (d, i) => 100 + i * (size + 5))
	// 	.attr("width", size)
	// 	.attr("height", size)
	// 	.style("fill", (d) => d)
	// 	.style("opacity", 0.7);
	
	// svg
	// 	.selectAll("mylabels")
	// 	.data(Object.keys(regionColors))
	// 	.join("text")
	// 	.attr("x", xOffset + size * 1.2) 
	// 	.attr("y", (d, i) => 100 + i * (size + 5) + size / 2)
	// 	.text((d) => d)
	// 	.attr("font-size", "15px")
	// 	.style("fill", "black")
	// 	.style("alignment-baseline", "middle")
	// 	.style("opacity", 0.7);
	
}
