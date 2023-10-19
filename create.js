//exploring interactivity for parallel coords
var dragging = {},
    foreground,
    background,
    highlighted,
    dimensions,                           
    legend,
    brush_count = 0,
    excluded_groups = [],
	extents;

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

// const tempColorScale = d3.scaleLinear()
// 		.range(["#8B0000", "red", "blue","#00008B"])
// 		.domain([-30, -10, 	10, 30]);
var tempColorScale = d3.scaleLinear()
	.range(["red", "#ffefef", "blue"])
	// .range(["#8B0000", "#ffefef", "#00008B"])
	.domain([-30,0,30]);
// Function to create a bar chart
function createStreamGraph(delays, temp) {
    // Select the #streamGraph element and append an SVG to it
	// All of these are different ways of formatting the data in an attempt to make it fit for the area chart
	const delaysFiltered = delays.filter(
		d => (d.DEP_DELAY && d.FL_DATE && d.ORIGIN_STATE && stateToRegion[d.ORIGIN_STATE])
	);

	const delaysPerDate = d3.rollups(delaysFiltered, 
		v => d3.sum(v, d => Math.max(d.DEP_DELAY, 0)), 
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

    //set the dimensions and margins of the graph
	//var margin = {top: 30, right: 10, bottom: 10, left: 10}
    const margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	let svg = d3.select("#streamGraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr('viewBox', '0 0 600 400');

	const xScale = d3.scaleTime()
		.domain([new Date("2018-12-01"), new Date("2018-12-31")])
		.range([0, width]);

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

	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0, ${height})`)
		.call(d3.axisBottom(xScale).ticks(d3.timeDay.every(2)).tickFormat(d3.timeFormat("%b %d")));

	svg.append("g")
		.attr("class", "y-axis")
		.call(d3.axisLeft(yScale));

	//console.log("temp", temp);
	const temperatureValues = d3.map(temperature, d => d.avgTempC);
	const days = d3.map(temperature, d => new Date(d.date).getDate());
	const dates = d3.map(temperature, d => d.date);

	// console.log("temperatureValues: ",temperatureValues)

	// console.log(`min tmp: ${Math.min(...temperatureValues)} max tmp: ${Math.max(...temperatureValues)}`);

	// Build X scales and axis:
	const x = d3.scaleBand()
		.range([ 1, width + 1 ])
		.domain(dates)
		.padding(0);
	const xDays = d3.scaleBand()
		.range([ 1, width + 1 ])
		.domain(days)
		.padding(0);
	svg.append("g")
		.attr("class", "axisXDays")
		.attr("transform", "translate(0," + height + ")")
		// .call(d3.axisBottom(xDays));
	// console.log("x", [d3.min(temperature, d => d.avgTempC),d3.max(temperature, d => d.avgTempC)]);
	// console.log("temp ",temp,temp.forEach(d => d.ORIGIN_AIRPORT));

	svg.selectAll()
      .data(temperature, function(d) {return d.date;})
      .enter()
      .append("rect")
	  .attr("class", "rect")
    .attr("fill", (d) => tempColorScale(d.avgTempC))
	//   .attr("opacity", 0.8)
    .attr("x", function(d) {return x(d.date) })
    //.attr("y", function(d) { return y(d.avgTempC) })
    .attr("width", x.bandwidth() )
    .attr("height", height );

	// console.log("filter",delaysPerDate);
	const lines = svg.selectAll(".line")
		.data(Object.keys(lineGenerators))
		.enter()
		.append("path")
		.attr("class", "line")
		.attr("d", d => lineGenerators[d](delaysPerDate.filter(item => item.region === d))).style("stroke", d => regionColors[d])
		.on("click", function(event, d) {
			// console.log("filtering data", d);
			updateIdioms(d);
		})
		.style("stroke-width", 5)
		.style("fill", "none");
}

function createParallelCoords(delays, temp) {

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
		// console.log(aggregatedData);
	// Convert the aggregated data back to an array for visualization
	const formattedData = Array.from(aggregatedData, ([key, value]) => ({ ORIGIN_AIRPORT: key, ...value }));
	// console.log(formattedData);

	// Define your dimensions
	const dimensions = ["DEP_DELAY_SUM", "ARR_DELAY_SUM", "CANCELLED_MEAN", "DIVERTED_MEAN", "AIRPORT_ELEVATION"];
	origDimensions = dimensions.slice(0);
	const yParallel = {};
	dimensions.forEach(dim => {
		yParallel[dim] = d3.scaleLinear()
			.domain([d3.max(d3.extent(formattedData, d => d[dim])), d3.min(d3.extent(formattedData, d => d[dim]))])
			.range([0, height]);
		if (dim == "CANCELLED_MEAN" || dim == "DIVERTED_MEAN")
		yParallel[dim] = d3.scaleLinear()
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
		.data(formattedData, (d) => d.ORIGIN_AIRPORT)
		.enter().append("path")
		.attr("d", path);
	// Add blue foreground lines for focus.
	foreground = svg.append("g")
		.attr("class", "foreground")
		.selectAll("path")
		.data(formattedData, (d) => d.ORIGIN_AIRPORT)
		.enter().append("path")
		.attr("class", (d) => d.ORIGIN)
		.attr("d", path)
		.style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
		.style("stroke-width", 1)
		.style("fill", "none")
		.style("cursor", "pointer")
		.style("pointer-events", "visible")
		// .on("mouseover", handleMouseOver) // Functi
		.on("mouseover", (event, d)=>{ showTooltip(event, d);})
		// .on("mouseover.second", (event, d)=>{ highlight(event, d)})
		.on("mouseout", hideTooltip) // Function defined below
		// .on("mouseout.second", unhighlight)
	// Add a group element for each dimension.
	// console.log("dim: ",dimensions);
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
		var g = svg.selectAll(".dimension");
		g.append("g")
			.attr("class", "axis")
			.each(function(d) {  
				if (d == "CANCELLED_MEAN" || d == "DIVERTED_MEAN")
					d3.select(this).call(d3.axisLeft(yParallel[d]));
				else {d3.select(this).call(d3.axisLeft(yParallel[d]).tickFormat(d3.format(".2s")));}
			})
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
				// console.log("brush?: ", y[d].name);
				if(yParallel[d].name == 'scale'){
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

	// TODO: Highlight the specie that is hovered
	// function highlight (event, d){
	// 	// console.log("highlight", d);
	// 	// first every group turns grey
	// 	d3.selectAll(".foreground")
	// 	  .transition().duration(200)
	// 	  .style("stroke", "lightgrey")
	// 	  .style("opacity", "0.2");
	// 	// Second the hovered specie takes its color
	// 	d3.select("." + d.ORIGIN)
	// 	  .transition().duration(200)
	// 	  .style("stroke", regionColors[stateToRegion[d.ORIGIN_STATE]])
	// 	  .style("opacity", "1");
	//   }
	// // Unhighlight
	// function unhighlight(d){
	// 	// console.log("unhighlight", d.ORIGIN);
	// 	d3.selectAll(".foreground")
	// 		.transition().duration(200).delay(10000)
	// 		.style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
	// 		.style("opacity", "1")
	// }
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
	}
	function brushend(event) {
		if (event.defaultPrevented) return; // click suppressed
	}
}
function createChordDiagram(delays, temp) {

	//#TO DO Add airport names!!
	// #TO DO Add boton to show only one region
	// #TO DO Show % of delays when you choose a region
	
    // console.log('Inside createChordDiagram:', delays, temp);

    const svgWidth = 650;
    const svgHeight = 550;
    const margin = { top: 0, right: 10, bottom: 10, left: 0 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const outerRadius = svgWidth * 0.38 - 40;
    const innerRadius = outerRadius - 20;
	
    const svg = d3
        .select("#chordDiagram")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${width / 2},${(height + width) / 5.5})`);


    const regions = ["west", "south", "midwest", "northeast"]; // regions

    // Create a matrix of the delays between regions
    const delaysMatrix = regions.map((sourceRegion) =>
        regions.map((targetRegion) => {
            const sum = d3.sum(delays.filter(d => stateToRegion[d.ORIGIN_STATE] === sourceRegion && stateToRegion[d.DEST_STATE] === targetRegion), d => d.DEP_DELAY);
            return sourceRegion === targetRegion ? 0 : sum; 
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
            return regionColors[regions[d.source.index]];
        });

    grads.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function (d) {
            return regionColors[regions[d.target.index]];
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
        .style("fill", (d) => regionColors[regions[d.index]])
        .style("stroke", (d) => regionColors[regions[d.index]])
        .attr("d", arc)
        .style("cursor", "pointer")
        .on("mouseover", handleMouseOver)
        .on("mouseout", hideTooltip);

    groups
        .append("text")
        .attr("x", 6)
        .attr("dy", 15)
        .append("textPath")
        .attr("xlink:href", (d) => `#group-arc-${d.index}`)
        .text((d) => regions[d.index]);

	function handleMouseOver(event, d) {
			const tooltip = d3.select("#tooltip");
			tooltip.transition().duration(200).style("opacity", 0.9);
			tooltip.html(`Region: ${regions[d.index]}`);
		}
    svg.selectAll("path.chord")
        .data(chord(delaysMatrix))
        .enter().append("path")
        .attr("class", "chord")
        .style("fill", function (d) {
            return `url(#chordGradient-${d.source.index}-${d.target.index})`;
        })
        .style("opacity", 0.8)
		.on("mouseover", (event, d)=>{ showTooltip(event, d)})
		// .on("mouseover.second", (event, d)=>{ highlight(event, d)})
		.on("mouseout", hideTooltip) // Functi
		// .on("mouseout.second", unhighlight)
        .attr("d", ribbon);
}

