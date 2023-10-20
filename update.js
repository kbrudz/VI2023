// Function to update the bar chart with new data
function updateParallel(data) {
    // width = 1200 - margin.left - margin.right;
	const width = widthParallel;
    // Select the SVG element of the bar chart
    const svg = d3.select("#parallelCoords").select("svg").select("g");
    // Group the data by ORIGIN_AIRPORT and calculate the sums and means
	const aggregatedData = d3.rollup(
		data,
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

	const dimensions = ["DEP_DELAY_SUM", "ARR_DELAY_SUM", "CANCELLED_MEAN", "DIVERTED_MEAN", "AIRPORT_ELEVATION"];
	origDimensions = dimensions.slice(0);
	yParallel = {};
	dimensions.forEach(dim => {
		yParallel[dim] = d3.scaleLinear()
			.domain([d3.max(d3.extent(formattedData, d => d[dim])), d3.min(d3.extent(formattedData, d => d[dim]))])
			.range([0, height]);
		if (dim == "CANCELLED_MEAN" || dim == "DIVERTED_MEAN")
			yParallel[dim] = d3.scaleLinear()
				.domain([1,0])
				.range([0, height]);
	});

	var x = d3.scalePoint().rangeRound([0, width]).padding(1).domain(dimensions),
		line = d3.line(),
		dragging = {},
		origDimensions;


	var line = d3.line();

    // Select all existing bars and bind the data to them
    background = svg.selectAll(".background").selectAll("path").data(formattedData, (d) => d.ORIGIN_AIRPORT);
    foreground = svg.selectAll(".foreground").selectAll("path").data(formattedData, (d) => d.ORIGIN_AIRPORT);

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
	
	var g = svg.selectAll(".dimension").data(dimensions)
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
		if (d == "CANCELLED_MEAN" || d == "DIVERTED_MEAN")
			d3.select(this).call(d3.axisLeft(yParallel[d]));
		else {d3.select(this).call(d3.axisLeft(yParallel[d]).tickFormat(d3.format(".2s")));}
	});
	// svg.selectAll(".brush").remove()
	g.selectAll(".brush")
		.each(function(d) {
			if(yParallel[d].name == 'scale'){
			d3.select(this)
				.call(yParallel[d].brush = d3.brushY()
					.extent([[-8, 0], [8,height]])
					.on("start", (event, d) => brushstart(event, d))
					.on("brush", (event, d) => brushing(event, d)))
					.on("end", (event, d) => brushend(event, d));
			}
		})
	
	function path(d) {
		return line(dimensions.map(function(p) { return [position(p), yParallel[p](d[p])]; }));
	}
	// function emptyPath(d) {
	//     return d3.line()(axes.map(function(p) { return [0, 0]; }));
	// }
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
	const x = d3.scaleBand()
		.range([ 1, width + 1 ])
		.domain(dates)
		.padding(0);
  
    // Select all existing circles and bind the data to them
	svg.selectAll(".rect")
		.data(avgTemp, function(d) {return d.date;})
		.transition()
		.duration(1000)
		.attr("fill", (d) => tempColorScale(d.avgTempC))
		.attr("x", function(d) {return x(d.date) });

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
    const outerRadius = width * 0.38 - 40;
    const innerRadius = outerRadius - 20;

	const regions = ["west", "south", "midwest", "northeast"];

	const delaysMatrix = regions.map((sourceRegion) =>
		regions.map((targetRegion) =>
			d3.sum(delays.filter(d => stateToRegion[d.ORIGIN_STATE] === sourceRegion && stateToRegion[d.DEST_STATE] === targetRegion), d => d.DEP_DELAY)
		)
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
				return regionColors[regions[d.source.index]];
		});

	grads.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", function (d) {
				return regionColors[regions[d.target.index]];
		});

	const groups = svg.selectAll("g.group")
		.data(chords.groups)
		.enter()
		.append("g")
		.attr("class", "group");

	groups.append("path")
		.style("fill", (d) => regionColors[regions[d.index]])
		.style("stroke", (d) => regionColors[regions[d.index]])
		.attr("d", arc)
		.style("cursor", "pointer")
		.on("click", handleClick)
		.on("mouseover", handleMouseOver)
		.on("mouseout", hideTooltip);

	groups.append("text")
		.attr("x", 6)
		.attr("dy", 15)
		.append("textPath")
		.attr("xlink:href", (d) => `#group-arc-${d.index}`)
		.text((d) => regions[d.index]);

	function handleClick(event, d) {
		updateIdioms(regions[d.index]);
	}

	function handleMouseOver(event, d) {
		const tooltip = d3.select("#tooltip");
		tooltip.transition().duration(200).style("opacity", 0.9);
		tooltip.html(`Region: ${regions[d.index]}`);
	}

	const chordPaths = svg.selectAll("path.chord")
		.data(chords)
		.enter().append("path")
		.attr("class", "chord")
		.style("fill", function (d) {
			return `url(#chordGradient-${d.source.index}-${d.target.index})`;
		})
		.style("opacity", 0.8)
		.on("mouseover", (event, d) => {
			showTooltip(event, d);
		})
		.on("mouseout", hideTooltip)
		.attr("d", ribbon);
		
}




//   // Function to update the line chart with new data
//   function updateLineChart(data) {
//     // Select the SVG element of the line chart
//     const svg = d3.select("#lineChart").select("svg").select("g");
  
//     // Create x and y scales for the chart
//     const xScale = d3
//       .scaleBand()
//       .domain(data.map((d) => d.oscar_year))
//       .range([width, 0])
//       .padding(1);
//     const yScale = d3
//       .scaleLinear()
//       .domain([0, d3.max(data, (d) => d.budget)])
//       .range([height, 0]);
  
//     // Create a line generator to draw the path based on the data points
//     const line = d3
//       .line()
//       .x((d) => xScale(d.oscar_year))
//       .y((d) => yScale(d.budget));
  
//     // Update the line with the new data points
//     svg.select(".line").datum(data).transition().duration(500).attr("d", line);
  
//     // Select all existing circles and bind the data to them
//     const circles = svg.selectAll(".circle").data(data, (d) => d.title);
  
//     // Update existing circles with transitions for position
//     circles
//       .transition()
//       .duration(500)
//       .attr("cx", (d) => xScale(d.oscar_year))
//       .attr("cy", (d) => yScale(d.budget));
  
//     // Add new circles for any new data points and transition them to their correct position
//     circles
//       .enter()
//       .append("circle")
//       .attr("class", "circle data")
//       .attr("cx", (d) => xScale(d.oscar_year))
//       .attr("cy", (d) => yScale(d.budget))
//       .attr("r", 0)
//       .attr("fill", "steelblue")
//       .attr("stroke", "black")
//       .transition()
//       .duration(500)
//       .attr("r", 5);
  
//     // Remove any circles that are no longer in the updated data
//     circles.exit().transition().duration(500).attr("r", 0).remove();
  
//     // Update the x-axis with the new data points, rotating the labels and adjusting the position
//     svg
//       .select(".x-axis")
//       .transition()
//       .duration(500)
//       .call(d3.axisBottom(xScale).tickSizeOuter(0))
//       .selectAll(".x-axis text")
//       .attr("transform", "rotate(-45)")
//       .style("text-anchor", "end")
//       .attr("dx", "-0.8em")
//       .attr("dy", "0.15em");
  
//     // Update the y-axis with the new data points, formatting the labels for budget in millions
//     svg
//       .select(".y-axis")
//       .transition()
//       .duration(500)
//       .call(
//         d3
//           .axisLeft(yScale)
//           .tickFormat((d) => d3.format(".1f")(d / 1000000) + "M")
//           .tickSizeOuter(0)
//       );
  
//     // Add tooltips to all circles with the movie title as the content
//     svg
//       .selectAll(".circle")
//       .on("mouseover", handleMouseOver)
//       .on("mouseout", handleMouseOut)
//       .append("title")
//       .text((d) => d.title);
//   }
  
//   function updateHistogram(data) {
//     // Select the SVG element of the bar chart
//     const svg = d3.select("#histogram").select("svg").select("g");
  
//     // Create x and y scales for the bar chart
//     const xScale = d3.scaleLinear().domain([d3.min(data,(d) => d.rating)-0.1,d3.max(data,(d) => d.rating)+0.1]).range([0, width]);
  
//     var histogram = d3.histogram()
//       .value((d) => d.rating)
//       .domain(xScale.domain())
//       .thresholds(xScale.ticks(16));
  
//     var bins = histogram(data);
  
//     const yScale = d3.scaleLinear().range([height, 0]);
//     yScale.domain([0, d3.max(bins, (d) => d.length)]);
  
//     // Select all existing bars and bind the data to them
//     const bars = svg.selectAll(".bar").data(bins, (d) => d.rating);
//     // Update existing bars with transitions for position, width, height, and color
//     bars
//       .transition()
//       .duration(1000)
//       .attr("x", 1)
//       .attr("transform", (d) => "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")") // transform x = 1 to right x placement (normalized)
//       .attr("width", (d) => (d.length>0)?xScale(d.x1) - xScale(d.x0) -1:0)
//       .attr("height", (d) => height - yScale(d.length))
//       .attr("fill", "steelblue");
  
//     // Add new bars for any new data points and transition them to their correct position and width
//     bars
//       .enter()
//       .append("rect")
//       .attr("class", "bar data")
//       .attr("x", 1)
//       .attr("transform", (d) => "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")") // transform x = 1 to right x placement (normalized)
//       .attr("width", 0)
//       .attr("height", (d) => height - yScale(d.length))
//       .attr("fill", "steelblue")
//       .transition()
//       .duration(2000)
//       .attr("width", (d) => (d.length>0)?xScale(d.x1) - xScale(d.x0) -1:0);
  
//     // Remove any bars that are no longer in the updated data
//     bars.exit().transition().duration(500).attr("width", 0).remove();
  
//     // Update the y-axis with the new data points
//     svg
//       .select(".x-axis")
//       .transition()
//       .duration(500)
//       .call(d3.axisBottom(xScale));
  
//     // Add tooltips to all bars with the movie title as the content
//     svg
//       .selectAll(".bar")
//       .on("mouseover", handleMouseOver)
//       .on("mouseout", handleMouseOut)
//       .append("title")
//       .text((d) => d.title);
  
//   }
  
  