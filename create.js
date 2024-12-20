//exploring interactivity for parallel coords
let dragging = {},
  foreground,
  background,
  highlighted,
  dimensions,
  brush_count = 0,
  excluded_groups = [],
	extents, tempUnit = "C";

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

const regionColors = {"west":"#F5C225", "south":"#6b17fc", "midwest":"#75C700", "northeast":"#F53A29"}

var tempColorScale = d3.scaleLinear()
		// .range(["red", "#ffefef", "blue"])
		.range(["#00008B", "#ffffff", "#8B0000"])
		.domain([-10,0,20]);

// Function to create a bar chart
function createStreamGraph(delays, temp) {
	//set the dimensions and margins of the graph
	//var margin = {top: 30, right: 10, bottom: 10, left: 10}

  // Select the #streamGraph element and append an SVG to it
	// All of these are different ways of formatting the data in an attempt to make it fit for the area chart
	const delaysFiltered = delays.filter(
		d => (d.DEP_DELAY && d.FL_DATE && d.ORIGIN_STATE && stateToRegion[d.ORIGIN_STATE] && d.DEST_STATE && stateToRegion[d.DEST_STATE])
	);

	const delaysPerDate = d3.rollups(
		delaysFiltered, 
		v => d3.mean(v, d => Math.max(d.DEP_DELAY, 0)), 
		d => d.FL_DATE,  
		d => stateToRegion[d.ORIGIN_STATE]
	).flatMap(
		([k1, v1]) => [...v1].map(([k2, v2]) => ({date: k1, region: k2, delay: v2}))
	);

	const temperature = d3.rollups(
		temp,
		group => ({
			avgTempC: d3.mean(group, d => d.AvgTemperatureC),
			avgTempF: d3.mean(group, d => d.AvgTemperatureF),
		}),
		d => d.Date
	).flatMap(
		([k1, v1]) => ({date: k1, avgTempC: v1.avgTempC, avgTempF: v1.avgTempF}));
	//console.log("temp: ",temperature);
	// append the svg object to the body of the page
	let svg = d3.select("#streamGraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right) 
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const xScale = d3.scaleTime()
		.domain([new Date("2018-12-01"), new Date("2018-12-31")])
		.range([0, width]);

		// const minDelay = d3.min(delaysPerDate, d => d.delays);
		// const maxDelay = d3.max(delaysPerDate, d => d.delay);
		
	const yScale = d3.scaleLinear()
		.domain([0, d3.max(delaysPerDate, d => d.delay)])
		.nice()
		.range([height, 0]);

	const lineGenerators = {};
	//console.log("filter",delaysPerDate);
	delaysPerDate.forEach(d => {
		if (isNaN(d.delay) || isNaN(d.region) || isNaN(d.date)){
			//console.log("nan values",d);
			//d.delay = 0;
			//d.region = "nowhere";
			//d.date = new Date("1-1-1");
			//console.log("nan values",d);
		}
		if (!lineGenerators[d.region]) {
			lineGenerators[d.region] = d3.line()
				.x(d => xScale(new Date(d.date)))
				.y(d => yScale(d.delay));
		}
	});

	//console.log("temp", temp);
	const temperatureValues = d3.map(temperature, d => d.avgTempC);
	const days = d3.map(temperature, d => new Date(d.date).getDate());
	const dates = d3.map(temperature, d => d.date);

	// console.log("temperatureValues: ",temperatureValues)

	// console.log(`min tmp: ${Math.min(...temperatureValues)} max tmp: ${Math.max(...temperatureValues)}`);

	// Build X scales and axis:
	let x = d3.scaleBand()
		.range([ 0, width ])
		.domain(dates)
		.padding(0);
	const bw = x.bandwidth();
	x.range([0, width + bw]);

	const xDays = d3.scaleBand()
		.range([ 1, width ])
		.domain(days)
		.padding(0);

	svg.selectAll()
		.data(temperature, function(d) {return d.date;})
		.enter()
		.append("rect")
		.attr("class", "rect")
		.attr("fill", (d) => tempColorScale(d.avgTempC))
		//   .attr("opacity", 0.8)
		.attr("x", (d) => x(d.date) - ((d.date === "2018-12-01") ? 0 : x.bandwidth()/2))
		//.attr("y", function(d) { return y(d.avgTempC) })
		.attr("width", (d) => (d.date === "2018-12-01" || d.date === "2018-12-31") ? x.bandwidth()/2 : x.bandwidth())
		.attr("height", height )
		.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut)
	
	const lines = svg.selectAll(".line")
		.data(Object.keys(lineGenerators))
		.enter()
		.append("path")
		.attr("class", "line data")
		.attr("d", d => lineGenerators[d](delaysPerDate.filter(item => item.region === d)))
		.style("stroke", d => regionColors[d])
		.style("stroke-width", 5)
		.style("fill", "none")
		.style("cursor", "pointer")
		.style("pointer-events", "visible")
		.on("click", function(event, d) {
			updateIdioms(d);
		})
		.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut)
		.style("stroke-width", 5)
		.style("fill", "none");

	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0, ${height})`)
		.call(d3
			.axisBottom(xScale)
			.ticks(d3.timeDay.every(2))
			.tickFormat(d3.timeFormat("%b %d"))
		);

	svg.append("g")
		.attr("class", "y-axis")
		.call(d3
			.axisLeft(yScale)
			.tickFormat(d => (d > 1000) ? (d / 1000) + "k" : d)
		);

	svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height/2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Delay (minutes)");

	createLegend();
}

function createParallelCoords(delays, temp) {

	// TODO: 
	// Highlight regions ?
	// DONEx -> MAS NOT REALLY broken BRUSH fix update
	// DONE tooltip with name
	// DONE fix grid layout based on lab4

      // set the dimensions and margins of the graph
	const width = widthParallel;
	  // Group the data by ORIGIN_AIRPORT and calculate the sums and means
	const aggregatedData = d3.rollup(
		delays,
		group => ({
			AvgDepartureDelayMinutes: d3.mean(group, d => d.DEP_DELAY),
			AvgArrivalDelayMinutes: d3.mean(group, d => d.ARR_DELAY),
			CancelledFlights: d3.mean(group, d => d.CANCELLED),
			DivertedFlights: d3.mean(group, d => d.DIVERTED),
			ORIGIN_TYPE: group[0].ORIGIN_TYPE, // Assuming it's the same for all entries of the same airport
			ORIGIN_STATE: group[0].ORIGIN_STATE, // Assuming it's the same for all entries of the same airport
			ORIGIN: group[0].ORIGIN, // Assuming it's the same for all entries of the same airport
			AIRPORT_ELEVATION: Number(group[0].ORIGIN_ELEVATION)
		}),
		d => d.ORIGIN_AIRPORT
	);
		// console.log(aggregatedData);
	// Convert the aggregated data back to an array for visualization
	const formattedData = Array.from(aggregatedData, ([key, value]) => ({ ORIGIN_AIRPORT: key, ...value }));
	// console.log(formattedData);

	// Define your dimensions
	const dimensions = ["AvgDepartureDelayMinutes", "AvgArrivalDelayMinutes", "CancelledFlights", "DivertedFlights", "AIRPORT_ELEVATION"];
	let yParallel = {};
	
	dimensions.forEach(dim => {
		yParallel[dim] = d3.scaleLinear()
			.domain([d3.max(d3.extent(formattedData, d => d[dim])), d3.min(d3.extent(formattedData, d => d[dim]))])
			.range([0, height]);
		if (dim == "DivertedFlights")
		yParallel[dim] = d3.scaleLinear()
			.domain([0.1,0])
			.range([0, height]);
		if (dim == "CancelledFlights")
		yParallel[dim] = d3.scaleLinear()
			.domain([0.03,0])
			.range([0, height]);
	});

	extents = dimensions.map(function(p) { return [0,0]; });

	const x = d3.scalePoint().rangeRound([0, width]).padding(1).domain(dimensions);
	let	line = d3.line(),
		origDimensions = dimensions.slice(0)
		background,
		foreground;

	const svg = d3.select("#parallelCoords").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  	.append("g")
		.attr("transform", "translate(" + -(margin.left)*4 + "," + margin.top + ")");
	
	// Add grey background lines for context.
	background = svg.append("g")
		.attr("class", "background data")
		.selectAll("path")
		.data(formattedData, (d) => d.ORIGIN_AIRPORT)
		.enter().append("path")
		.attr("d", path);
	// Add blue foreground lines for focus.
	foreground = svg.append("g")
		.attr("class", "foreground")
		.selectAll("path")
		.data(formattedData, (d) => d.ORIGIN_AIRPORT)
		.enter().append("path")
		.attr("d", path)
		.attr("class","data")
		.style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
		.style("stroke-width", 1)
		.style("fill", "none")
		.style("cursor", "pointer")
		.style("pointer-events", "visible")
		// .on("mouseover", handleMouseOver) // Functi
		.on("mouseover", (event, d)=>{ handleMouseOver(event, d);})
		// .on("mouseover.second", (event, d)=>{ highlight(event, d)})
		.on("mouseout", handleMouseOut) // Function defined below
		// .on("mouseout.second", unhighlight)
	// Add a group element for each dimension.
	// console.log("dim: ",dimensions);

	let g = svg.selectAll(".dimension")
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
				// console.log("dragging")
			})
			.on("end", function(d) {
				delete dragging[d];
				// transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
				transition(foreground).attr("d", path);
				transition(background).attr("d", path);
					
					var new_extents = [];
					for(var i=0;i<dimensions.length;++i){
						new_extents.push(extents[origDimensions.indexOf(dimensions[i])]);
					  }
					  extents = new_extents;
					  origDimensions = dimensions.slice(0);
			}));
		// Add an axis and title.
		g = svg.selectAll(".dimension");
		
		g.append("g")
			.attr("class", "axis")
			.each(function(d) {  
				if (d == "CancelledFlights")
					d3.select(this).call(d3.axisLeft(yParallel[d]).ticks(7).tickFormat(d3.format(".1%")));
				else if (d == "DivertedFlights")
					d3.select(this).call(d3.axisLeft(yParallel[d]).tickFormat(d3.format(".0%")));
				else {d3.select(this).call(d3.axisLeft(yParallel[d]).tickFormat(d3.format(".2s")));}
			})
				//text does not show up because previous line breaks somehow
				.append("text")
				.attr("fill", "black")
				.style("text-anchor", "middle")
				.attr("y", -9) 
				.style("cursor", "grab")
				.text(function(d) { return d; });

		// Add and store a brush for each axis.
		g.append("g")
			.attr("class", "brush")
			.each(function(d) {
				// console.log("brush?: ", y[d].name);
				if(yParallel[d].name === 'scale'){
				// console.log(this);
				d3.select(this)
					.call(yParallel[d].brush = d3.brushY()
						.extent([[-8, 0], [8,height]])
						.on("start", brushstart)
						.on("brush", brushing))
						.on("end", brushend);
				}
			})
			.selectAll("rect")
			.attr("x", -8)
			.attr("width", 16);

	// Returns the path for a given data point.
	function path(d) {
		return line(dimensions.map(function(p) { return [position(p), yParallel[p](d[p])]; }));
	}
	function position(d) {
		var v = dragging[d];
		return v == null ? x(d) : v;
	}
	function transition(g) {
		// console.log ("transitioning create", g);
		return g.transition().duration(500);
	}
	
	// Handles a brush event, toggling the display of foreground lines.
	function brushstart(event) {
		event.sourceEvent.stopPropagation();  
	}

	function brushing(event) {
		for(var i=0;i<dimensions.length;++i){
			if(event.target==yParallel[dimensions[i]].brush) {
				// console.log("yPar",yParallel[dimensions[i]], "\ninvert",yParallel[dimensions[i]].invert);
				  extents[i]=event.selection.map(yParallel[dimensions[i]].invert,yParallel[dimensions[i]]);
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
		console.log("extents",extents);
	}
	
	function brushend(event) {
		if(event.defaultPrevented) return; // click suppressed
	}
}

function createChordDiagram(delays, temp) {

	//#TO DO Add airport names!!
	// #TO DO Add boton to show only one region
	// #TO DO Show % of delays when you choose a region
	
    // console.log('Inside createChordDiagram:', delays, temp);
	const width = 550;
    const outerRadius = width * 0.35 - 40;
    const innerRadius = outerRadius - 20;
    const svg = d3
			.select("#chordDiagram")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${(width / 2)-margin.left},${(height) / 2})`);

    // Create a matrix of the delays between regions
		const delaysMatrix = globalRegions.map((sourceRegion) =>
		globalRegions.map((targetRegion) => {
        const matchingDelays = delays.filter(d => stateToRegion[d.ORIGIN_STATE] === sourceRegion && stateToRegion[d.DEST_STATE] === targetRegion);
        if (matchingDelays.length === 0) return 0; // To prevent division by zero, return 0 if no matching delays
        return d3.mean(matchingDelays, d => d.DEP_DELAY);
    	})
		);

    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
        .radius(innerRadius);
	const chords = chord(delaysMatrix); // Zdefiniuj chords przed użyciem
	const grads = svg.append("defs").selectAll("linearGradient")
		.data(chords) // Popraw to
		.enter().append("linearGradient")
		.attr("id", function (d) {
			return `chordGradient-${d.source.index}-${d.target.index}`;
		})
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", function (d) {
            return innerRadius * Math.cos((d.source.endAngle - d.source.startAngle) / 2 + d.source.startAngle - Math.PI / 2);
        })
        .attr("y1", function (d) {
            return innerRadius * Math.sin((d.source.endAngle - d.source.startAngle) / 2 + d.source.startAngle - Math.PI / 2);
        })
        .attr("x2", function (d) {
            return innerRadius * Math.cos((d.target.endAngle - d.target.startAngle) / 2 + d.target.startAngle - Math.PI / 2);
        })
        .attr("y2", function (d) {
            return innerRadius * Math.sin((d.target.endAngle - d.target.startAngle) / 2 + d.target.startAngle - Math.PI / 2);
        });

		grads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function (d) {
            return regionColors[globalRegions[d.source.index]];
        });

    grads.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function (d) {
            return regionColors[globalRegions[d.target.index]];
        });
	// Create the arcs + shows region when you hover over it
	const groups = svg
        .selectAll("g.group")
        .data(chords.groups)
        .enter()
        .append("g")
        .attr("class", "group");

    groups
        .append("path")
				.attr("class", "data")
        .style("fill", (d) => regionColors[globalRegions[d.index]])
        .style("stroke", (d) => regionColors[globalRegions[d.index]])
        .attr("d", arc)
        .style("cursor", "pointer")
				.on("click", (d) => updateIdioms(globalRegions[d.index]))
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    groups
        .append("text")
        .attr("x", 6)
        .attr("dy", 15)
        .append("textPath")
        .attr("xlink:href", (d) => `#group-arc-${d.index}`)
        .text((d) => globalRegions[d.index]);

	const labels = svg
		.selectAll("g.label")
		.data(chords.groups)
		.enter()
		.append("g")
		.attr("class", "label")
		.attr("transform", (d) => {
			let angle = (d.startAngle + d.endAngle) / 2;
			const radius = outerRadius + 15; // Adjust the radius for label placement
			
			if (d.index == 1 || d.index == 2){
				return `translate(${radius * Math.cos(angle - Math.PI / 2)}, ${radius * Math.sin(angle - Math.PI / 2)}) rotate(${angle * (180 / Math.PI)}) rotate(180)`;
			}
			else{
				return `translate(${radius * Math.cos(angle - Math.PI / 2)}, ${radius * Math.sin(angle - Math.PI / 2)}) rotate(${angle * (180 / Math.PI)})`;
			}	
			
		});
	
	labels
		.append("text")
		.attr("dy", 8) // Adjust the vertical position
		.attr("text-anchor", "middle")
		.attr("class", "slanted-label")
		.style("fill", (d) => regionColors[globalRegions[d.index]]) // Set text fill color
		.attr("stroke", (d) => regionColors[globalRegions[d.index]]) // Set text fill color
		.attr("font-weight",900)
		.text((d) => globalRegions[d.index]);

	// Function implemented in linked.js
	// function handleMouseOver(event, d) {
	// 		const tooltip = d3.select("#tooltip");
	// 		tooltip.transition().duration(200).style("opacity", 0.9);
	// 		tooltip.html(`Region: ${regions[d.index]}`);
	// 	}
    svg.selectAll("path.chord")
        .data(chord(delaysMatrix))
        .enter().append("path")
        .attr("class", "chord")
        .style("fill", function (d) {
            return `url(#chordGradient-${d.source.index}-${d.target.index})`;
        })
        .attr("d", ribbon);

		d3.selectAll("path.chord").attr("opacity", 0.8);
}
function createLegend(){
	var legend = [[20,1],[0,1],[-10,1]];
	const widthLegend = 20;
	const heightLegend = 100;
	let svgLegend = d3.select("#legend")
		.append("svg")
		.attr("width", widthLegend + margin.left )
		.attr("height", heightLegend + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + widthLegend + "," + margin.top + ") rotate(90)");
	var xLegend = d3.scaleBand()
		.range([ 0, heightLegend ])
		.domain(legend.map(d => d[0]))
		.padding(0.2);
	let tickLabels = ["20ºC", "0ºC", "-10ºC"];
	svgLegend.append("g")
		.attr("transform", "translate(" + 0 + ",0)")
		.attr("class", "legend")
		.call(d3.axisBottom(xLegend).ticks(3).tickFormat((d,i) => tickLabels[i]))
		.attr('stroke-width', 0)
		.selectAll("text")
		.attr("transform", "translate(-12,-5) rotate(-90)")
		.style("text-anchor", "start");
	// Add Y axis
	var yLegend = d3.scaleLinear()
		.domain([0, 1])
		.range([ widthLegend, 0]);
	// Bars
	svgLegend.selectAll("mybar")
		.data(legend)
		.enter()
		.append("rect")
		.attr("x", function(d) { return xLegend(d[0]); })
		.attr("y", function(d) { return yLegend(d[1]); })
		.attr("width", xLegend.bandwidth())
		.attr("height", function(d) {return widthLegend - yLegend(d[1]); })
		.attr("fill", d => tempColorScale(d[0]))
		.attr('stroke-width', 1)
		.attr('stroke', d => d3.rgb(tempColorScale(d[0])).darker(1))
	/*
	// Create data = list of groups
	var allGroup = ["Celsius", "Fahrenheit"]
	// Initialize the button
	var dropdownButton = d3.select("#selectButton")
		.append('select')
		.attr("transform", "translate(-" + 1000 + "," + 0+ ") rotate(90)");
	// add the options to the button
	dropdownButton // Add a button
		.selectAll('myOptions') // Next 4 lines add 6 options = 6 colors
		.data(allGroup)
		.enter()
		.append('option')
		.text(function (d) { return d; }) // text showed in the menu
		.attr("value", function (d) { return d; }) // corresponding value returned by the button
	// When the button is changed, run the updateChart function
	dropdownButton.on("change", function(d) {
		const unit = {"Celsius":"C", "Fahrenheit":"F"}
		// recover the option that has been chosen
		var selectedOption = d3.select(this).property("value")
		// run the updateChart function with this selected option
		updateTempUnit(unit[selectedOption]);
	})*/
}
