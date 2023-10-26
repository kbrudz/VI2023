// Function to update the bar chart with new data
function updateParallel(data) {
	console.log("extents before update", extents);
    // width = 1200 - margin.left - margin.right;
	const width = widthParallel;
    // Select the SVG element of the bar chart
    const svg = d3.select("#parallelCoords").select("svg").select("g");
    // Group the data by ORIGIN_AIRPORT and calculate the sums and means
	const aggregatedData = d3.rollup(
		data,
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

	const x = d3.scalePoint().rangeRound([0, width]).padding(1).domain(dimensions);
	
	let line = d3.line(),
		dragging = {},
		origDimensions = dimensions.slice(0);

	// Select all existing bars and bind the data to them
	background = svg.selectAll(".background").selectAll("path").data(formattedData, (d) => d.ORIGIN_AIRPORT);
	foreground = svg.selectAll(".foreground").selectAll("path").data(formattedData, (d) => d.ORIGIN_AIRPORT);
	console.log("formatted data",formattedData);
	// Update existing bars with transitions for position, width, height, and color
	background
		.transition()
		.duration(1000)
		.attr("d", path);
	foreground
		.transition()
		.duration(1000)
		.attr("d", path)
		.style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
		.style("stroke-width", 1)
		.style("fill", "none");

	// Add new bars for any new data points and transition them to their correct position and width
	background
		.enter()
		.append("path")
		.attr("class", (d) => d.ORIGIN)
		.attr("d", path)
		.transition()
		.duration(4000);
	foreground
		.enter()
		.append("path")
		.attr("class", (d) => d.ORIGIN)
		.attr("d", path)
		.attr("class","data")
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
		.transition()
		.duration(4000);

	// Remove any bars that are no longer in the updated data
	background.exit().transition().duration(100).attr("width", 0).remove();
	foreground.exit().transition().duration(100).attr("width", 0).remove();
	
	let g = svg.selectAll(".dimension").data(dimensions)
		.data(dimensions)
		.attr("transform", function(d) { return "translate(" + x(d) + ")"; })
		.call(d3.drag()
			.subject(function(d) { return {x: x(d)}; })
			.on("start", function(d) {
				dragging[d] = x(d);
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
				// console.log("dragging from update", d, position(d))
			})
			.on("end", function(d) {
				delete dragging[d];
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
	g.selectAll(".axis")
	.each(function(d) {  
		if (d == "CancelledFlights")
			d3.select(this).call(d3.axisLeft(yParallel[d]).ticks(10).tickFormat(d3.format(".1%")));
		else if (d == "DivertedFlights")
			d3.select(this).call(d3.axisLeft(yParallel[d]).tickFormat(d3.format(".0%")));
		else {d3.select(this).call(d3.axisLeft(yParallel[d]).tickFormat(d3.format(".2s")));}
	});
	// svg.selectAll(".brush").remove()
	//--------------------------------------------------------
	d3.selectAll(".brush").each(function(d) {
		// console.log("brush?: ", y[d].name);
		if(yParallel[d].name == 'scale'){
		// console.log(this);
		d3.select(this)
			.call(yParallel[d].brush = d3.brushY()
				.extent([[-8, 0], [8,height]])
				.on("start", brushstart)
				.on("brush", brushing))
				.on("end", brushend);
		d3.select(this).select(".selection").style("display", "none");
		
		}
	})
	
	//-----------------------------------------
	
	// yParallelInverted = {};
	// dimensions.forEach(dim => {
	// 	yParallelInverted[dim] = d3.scaleLinear()
	// 		.domain([0, height])
	// 		.range([d3.max(d3.extent(formattedData, d => d[dim])), d3.min(d3.extent(formattedData, d => d[dim]))]);
	// 	if (dim == "CancelledFlights" || dim == "DivertedFlights")
	// 		yParallelInverted[dim] = d3.scaleLinear()
	// 			.domain([0, height])
	// 			.range([1,0]);
	// });

	// TODO FIX brush
	// var new_extents = [], y0, y1;
	// new_extents = dimensions.map(function(p) { return [0,0]; });
	// for (var i = 0; i<new_extents.length; i++){
	// 	if (extents[i][0] == 0 && extents[i][1] == 0){
	// 		continue;
	// 	}
	// 	else{
	// 		y0 = yParallel[dimensions[i]](extents[i][1]);
	// 		y1 = yParallel[dimensions[i]](extents[i][0]);
	// 		new_extents[i][1] = (y0 - y1);//height
	// 		new_extents[i][0] = y1+((y0 - y1)/2);
	// 		console.log("y0", y0, "y1", y1, "old extents",extents[i],"new_extents", new_extents[i]);
	// 	}
	// }
	// }
	// for(var i=0;i<dimensions.length;++i){
	// 	console.log("yPar",yParallel[dimensions[i]], "\ninvert",yParallel[dimensions[i]].invert);
	// 	// extents[i]=d3.selectAll(".dimension").map(yParallel[dimensions[i]].invert,yParallel[dimensions[i]]);
	// }
	// console.log("new extents fds",new_extents);
	// var i = -1;
	// d3.selectAll(".selection")
	// 	.attr("y", d => {console.log("brushing selection found",d);i++; return new_extents[i][0];})
	// 	.transition()
	// 	.duration(1000);
		// .attr("height", new_extents[i][1])
		// .style("height", new_extents[i][1]);

	
	function path(d) {
		return line(dimensions.map(function(p) { return [position(p), yParallel[p](d[p])]; }));
	}
	function emptyPath(d) {
	    return d3.line()(axes.map(function(p) { return [0, 0]; }));
	}
	function position(d) {
		var v = dragging[d];
		return v == null ? x(d) : v;
	}
	function transition(g) {
		// console.log ("transitioning", g);
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

	// Insert empty line to fix bug
	var empty = {"AIRPORT_ELEVATION": 0,"AvgArrivalDelayMinutes":0, "AvgDepartureDelayMinutes":0,
		"CancelledFlights": 0,"DivertedFlights":0, "ORIGIN":0,
		"ORIGIN_AIRPORT": "","ORIGIN_STATE":0, "ORIGIN_TYPE":0
	}
	formattedData.push(empty);
	background = svg.selectAll(".background").selectAll("path").data(formattedData, (d) => d.ORIGIN_AIRPORT);
	foreground = svg.selectAll(".foreground").selectAll("path").data(formattedData, (d) => d.ORIGIN_AIRPORT);
	// console.log("new formatted data",formattedData);
	
	background
		.transition()
		.duration(1000)
		.attr("d", path);
	foreground
		.transition()
		.duration(1000)
		.attr("d", path)
		.style("stroke", (d) => {
			if (d.ORIGIN_AIRPORT != "") 
				return regionColors[stateToRegion[d.ORIGIN_STATE]];
			})
		.style("stroke-width", (d) => {
			if (d.ORIGIN_AIRPORT != "") 
				return 1;
			else return 0;
			})
		.style("fill", "none");

	background
		.enter()
		.append("path")
		.attr("class", (d) => d.ORIGIN)
		.attr("d", path)
		.transition()
		.duration(4000);
	foreground
		.enter()
		.append("path")
		.attr("class", (d) => d.ORIGIN)
		.attr("d", (d)=> {if (d.ORIGIN_AIRPORT!= "") return path;})
		.attr("class","data")
		.style("stroke", (d) => {
			if (d.ORIGIN_AIRPORT != "") 
				return regionColors[stateToRegion[d.ORIGIN_STATE]];
			})
		.style("stroke-width", (d) => {
			if (d.ORIGIN_AIRPORT != "") 
				return 1;
			else return 0;
			})
		.style("fill", "none")
		.style("cursor", "pointer")
		.style("pointer-events", "visible")
		// .on("mouseover", handleMouseOver) // Functi
		.on("mouseover", (event, d)=>{ showTooltip(event, d);})
		// .on("mouseover.second", (event, d)=>{ highlight(event, d)})
		.on("mouseout", hideTooltip) // Function defined below
		// .on("mouseout.second", unhighlight)
		.transition()
		.duration(4000);

	background.exit().transition().duration(100).attr("width", 0).remove();
	foreground.exit().transition().duration(100).attr("width", 0).remove();



	foreground.style("display", function(d) {
		return dimensions.every(function(p, i) {
			if(extents[i][0]==0 && extents[i][0]==0) {
				return true;
			}
		return extents[i][1] <= d[p] && d[p] <= extents[i][0];
		}) ? null : "none";
	}); 
}
  
// Function to update the graph with new data
function updateStream(delays, temp) {

    const delaysFiltered = delays.filter(
		d => (d.DEP_DELAY && d.FL_DATE && d.ORIGIN_STATE && stateToRegion[d.ORIGIN_STATE])
	);

    // Select the SVG element of the graph
    const svg = d3.select("#streamGraph").select("svg").select("g");
  
    const delaysPerDate = d3.rollups(delaysFiltered, 
		v => d3.mean(v, d => Math.max(d.DEP_DELAY, 0)), 
		d => d.FL_DATE,  
		d => stateToRegion[d.ORIGIN_STATE]
	).flatMap(
		([k1, v1]) => [...v1].map(([k2, v2]) => ({date: k1, region: k2, delay: v2}))
	);

  const xScale = d3.scaleTime()
		.domain([new Date("2018-12-01"), new Date("2018-12-31")])
		.range([0, width]);

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(delaysPerDate, d => d.delay)])
		.nice()
		.range([height, 0]);

	const lineGenerators = {};
    delaysPerDate.forEach(d => {
		if (!lineGenerators[d.region]) {
			lineGenerators[d.region] = d3.line()
				.x(d => xScale(new Date(d.date)))
				.y(d => yScale(d.delay));
		}
	});

	const avgTemp = d3.rollups(
		temp,
		group => ({
			avgTempC: d3.mean(group, d => d.AvgTemperatureC),
			avgTempF: d3.mean(group, d => d.AvgTemperatureF),
		}),
		d => d.Date
	).flatMap(
		([k1, v1]) => ({date: k1, avgTempC: v1.avgTempC, avgTempF: v1.avgTempF})
    );
		
	const temperatureValues = d3.map(avgTemp, d => d.avgTempC);
	// console.log(`min tmp: ${Math.min(...temperatureValues)} max tmp: ${Math.max(...temperatureValues)}`);
		
  const days = d3.map(avgTemp, d => new Date(d.date).getDate());
	const dates = d3.map(avgTemp, d => d.date);

	// Build X scales and axis:
	let x = d3.scaleBand()
		.range([ -10, width + 10 ])
		.domain(dates)
		.padding(0);
	const bw = x.bandwidth();
	x.range([0, width + bw]);
  
    // Select all existing circles and bind the data to them
	svg.selectAll(".rect")
		.data(avgTemp, function(d) {return d.date;})
		.transition()
		.duration(1000)
		.attr("fill", (d) => tempColorScale(d.avgTempC))
		.attr("x", (d) => x(d.date) - ((d.date === "2018-12-01") ? 0 : x.bandwidth()/2));

    svg.selectAll(".line")
      .data(['northeast','west','midwest','south'])
      .transition()
      .duration(1000)
      .attr("d", d => {
        if(Object.keys(lineGenerators).includes(d))
          return lineGenerators[d](delaysPerDate.filter(item => item.region === d));
        })
      .style("stroke", d => {
        if(Object.keys(lineGenerators).includes(d)) 
          return regionColors[d];
        else return "none"
      })

		svg.select(".y-axis")
			.transition()
			.duration(1000)
			.call(d3
				.axisLeft(yScale)
				.tickFormat(d => (d > 1000) ? (d / 1000) + "k" : d)
			);
  
    // Add tooltips to all circles with the movie title as the content
    // svg
    //   .selectAll(".circle")
    //   .on("mouseover", handleMouseOver)
    //   .on("mouseout", handleMouseOut)
    //   .append("title")
    //   .text((d) => d.title);
}

function updateChordDiagram(delays, temp) {
	// console.log('Inside updateChordDiagram:', delays, temp);
	const svg = d3.select("#chordDiagram").select("svg").select("g");
	svg.selectAll("*").remove(); 
    const outerRadius = width * 0.35 - 40;
    const innerRadius = outerRadius - 20;

	const delaysMatrix = globalRegions.map((sourceRegion) =>
		globalRegions.map((targetRegion) => {
        const matchingDelays = delays.filter(d => stateToRegion[d.ORIGIN_STATE] === sourceRegion && stateToRegion[d.DEST_STATE] === targetRegion);
        if (matchingDelays.length === 0) {
            return 0; // To prevent division by zero, return 0 if no matching delays
        }
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

	const chords = chord(delaysMatrix);

	const grads = svg.append("defs").selectAll("linearGradient")
		.data(chords)
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

	const groups = svg.selectAll("g.group")
		.data(chords.groups)
		.enter()
		.append("g")
		.attr("class", "group");

	groups.append("path")
		.attr("class", "data")
		.style("fill", (d) => regionColors[globalRegions[d.index]])
		.style("stroke", (d) => regionColors[globalRegions[d.index]])
		.attr("d", arc)
		.style("cursor", "pointer")
		.on("click", handleClick)
		.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut);	
	const labels = svg
		.selectAll("g.label")
		.data(chords.groups)
		.enter()
		.append("g")
		.attr("class", "label")
		.attr("transform", (d) => {
			let angle = (d.startAngle + d.endAngle) / 2;
			const radius = outerRadius + 9; // Adjust the radius for label placement
			
			if (d.index == 1 || d.index == 2){
				return `translate(${radius * Math.cos(angle - Math.PI / 2)}, ${radius * Math.sin(angle - Math.PI / 2)}) rotate(${angle * (180 / Math.PI)}) rotate(180)`;
			}
			else{
				return `translate(${radius * Math.cos(angle - Math.PI / 2)}, ${radius * Math.sin(angle - Math.PI / 2)}) rotate(${angle * (180 / Math.PI)})`;
			}	
			
		});
	
	labels
		.append("text")
		.attr("dy", 6) // Adjust the vertical position
		.attr("text-anchor", "middle")
		.attr("class", "slanted-label")
		.style("fill", (d) => regionColors[globalRegions[d.index]]) // Set text fill color
		// .attr("stroke", (d) => regionColors[globalRegions[d.index]]) // Set text fill color
		.attr("font-weight",900)
		.text((d) => globalRegions[d.index]);

		function handleClick(event, d) {
			updateIdioms(globalRegions[d.index]);
			const groups = svg.selectAll("g.group");
		/*
			groups.select("path")
				.style("stroke", (d) => regionColors[globalRegions[d.index]])
				.style("stroke-width", null);
		
			const selectedGroup = groups.filter((groupData) => groupData.index === d.index);
			selectedGroup.select("path")
				.style("stroke", "#fbfe88")  
				.style("stroke-width", 3); 
		*/
	}

	const chordPaths = svg.selectAll("path.chord")
		.data(chords)
		.enter().append("path")
		.attr("class", "chord")
		.style("fill", function (d) {
			return `url(#chordGradient-${d.source.index}-${d.target.index})`;
		})
		.attr("d", ribbon);

		d3.selectAll("path.chord").attr("opacity", 0.8);
}

  