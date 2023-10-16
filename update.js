// Function to update the bar chart with new data
function updateParallel(data) {
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
		console.log(aggregatedData);
	// Convert the aggregated data back to an array for visualization
	const formattedData = Array.from(aggregatedData, ([key, value]) => ({ ORIGIN_AIRPORT: key, ...value }));

	const dimensions = ["DEP_DELAY_SUM", "ARR_DELAY_SUM", "CANCELLED_MEAN", "DIVERTED_MEAN", "AIRPORT_ELEVATION"];
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

	var x = d3.scalePoint()
		.rangeRound([0, widthParallel])
		.padding(1)
		.domain(dimensions);
	var g = svg.selectAll(".dimension")
		.attr("transform", function(d) { return "translate(" + x(d) + ")"; })
		

    function path(d) {
		return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }
    // function emptyPath(d) {
    //     return d3.line()(axes.map(function(p) { return [0, 0]; }));
    // }
	var line = d3.line();

    // Select all existing bars and bind the data to them
    const background = svg.selectAll(".background").selectAll("path").data(formattedData);
    const foreground = svg.selectAll(".foreground").selectAll("path").data(formattedData);

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
        .transition()
        .duration(4000);
  
    // Remove any bars that are no longer in the updated data
    background.exit().transition().duration(100).attr("width", 0).remove();
    foreground.exit().transition().duration(100).attr("width", 0).remove();
	
	// svg.selectAll(".brush").remove()
	d3.selectAll(".brush")
		.each(function(d) {
			if(y[d].name == 'scale'){
			d3.select(this)
				.call(y[d].brush = d3.brushY()
					.extent([[-8, 0], [8,height]])
					.on("start", (event, d) => brushstart(event, d))
					.on("brush", (event, d) => brushing(event, d)))
					.on("end", (event, d) => brushend(event, d));
			}
		})
	// Add an axis and title.
	svg.selectAll(".axis")
		.each(function(d) {  d3.select(this).call(d3.axisLeft(y[d]));})
		//text does not show up because previous line breaks somehow
		.append("text")
		.attr("fill", "black")
		.style("text-anchor", "middle")
		.attr("y", -9) 
		.text(function(d) { return d; });

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
  
  // Function to update the scatter plot with new data
  function updateStream(delays, temp) {
	const margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // Select the SVG element of the scatter plot
    const svg = d3.select("#streamGraph").select("svg").select("g");
  
	const temperature = d3.rollups(
		temp,
		group => ({
			avgTempC: d3.mean(group, d => d.AvgTemperatureC),
			avgTempF: d3.mean(group, d => d.AvgTemperatureF),
		}),
		d => d.Date
	).flatMap(
		([k1, v1]) => ({date: k1, avgTempC: v1.avgTempC, avgTempF: v1.avgTempF}));
	
    // Create scales for the plot
    var temperatureValues = d3.map(temperature, d => d.avgTempC);
	var color = d3.scaleLinear()
		.range(["red", "#ffefef", "blue"])
		.domain([d3.min(temperatureValues),(d3.min(temperatureValues)+d3.min(temperatureValues)/2), d3.max(temperatureValues)]);
	var days = d3.map(temperature, d => new Date(d.date).getDate());
	var dates = d3.map(temperature, d => d.date);

	// Build X scales and axis:
	var x = d3.scaleBand()
		.range([ 0, width ])
		.domain(dates)
		.padding(0.01);
	var xDays = d3.scaleBand()
		.range([ 0, width ])
		.domain(days)
		.padding(0.01);
	
  
    // Select all existing circles and bind the data to them
    const rects = svg.selectAll(".rect")
		.data(temperature, function(d) {return d.date+':'+d.avgTempC;});
  
    // Update existing circles with transitions for position and radius
    rects
      .transition()
      .duration(1000)
      .attr("fill", (d) => color(d.avgTempC))
      .attr("x", function(d) {return x(d.date) });
  
    // Add new circles for any new data points and transition them to their correct position and radius
    rects
      .enter()
      .append("rect")
      .attr("class", "rect" )
      .attr("fill", (d) => color(d.avgTempC))
      .attr("x", function(d) {return x(d.date) })
    //   .attr("y", function(d) { return y(d.avgTempC) })
      .attr("width", x.bandwidth() )
      .attr("height", height )
      .transition()
      .duration(500);
  
    // Remove any circles that are no longer in the updated data
    rects.exit().transition().duration(500).attr("y", 0).remove();
  
  
    // Update the x-axis with the new data points, formatting the labels for budget in millions
    svg
      .select(".axisXDays")
      .transition()
      .duration(500)
      .call(d3.axisBottom(xDays));
  
    // Add tooltips to all circles with the movie title as the content
    // svg
    //   .selectAll(".circle")
    //   .on("mouseover", handleMouseOver)
    //   .on("mouseout", handleMouseOut)
    //   .append("title")
    //   .text((d) => d.title);
  }
  function updateChordDiagram(delays, temp) {
    console.log('Inside updateChordDiagram:', delays, temp);

    const svgWidth = 650;
    const svgHeight = 550;
    const margin = { top: 0, right: 10, bottom: 10, left: 0 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const outerRadius = svgWidth * 0.38 - 40;
    const innerRadius = outerRadius - 20;

    const svg = d3.select("#chordDiagram");

    const regions = ["west", "south", "midwest", "northeast"];

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

    const chords = chord(delaysMatrix);

    const grads = svg.selectAll("defs linearGradient")
        .data(chords);

    grads.enter()
        .append("linearGradient")
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
        .data(chords.groups);

    groups.exit().remove();

    groups.enter()
        .append("g")
        .attr("class", "group");

    groups.select("path")
        .style("fill", (d) => regionColors[regions[d.index]])
        .style("stroke", (d) => regionColors[regions[d.index]])
        .attr("d", arc);

    groups.select("text")
        .attr("x", 6)
        .attr("dy", 15)
        .select("textPath")
        .attr("xlink:href", (d) => `#group-arc-${d.index}`)
        .text((d) => regions[d.index]);

    const chordPaths = svg.selectAll("path.chord")
        .data(chord(delaysMatrix));

    chordPaths.exit().remove();

    chordPaths.transition()
        .duration(1000)
        .style("fill", function (d) {
            return `url(#chordGradient-${d.source.index}-${d.target.index})`;
        });
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
  
  