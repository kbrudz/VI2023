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
	
    // Create a scale for each attribute (column)
	const scales = {};
	const axes = ["DEP_DELAY_SUM", "ARR_DELAY_SUM", "CANCELLED_MEAN", "DIVERTED_MEAN", "AIRPORT_ELEVATION"];
	axes.forEach(attribute => {
		scales[attribute] = d3.scaleLinear()
			.domain([d3.max(d3.extent(formattedData, d => d[attribute])), d3.min(d3.extent(formattedData, d => d[attribute]))])
			.range([0, height]);
		if (attribute == "CANCELLED_MEAN" || attribute == "DIVERTED_MEAN")
		scales[attribute] = d3.scaleLinear()
			.domain([1,0])
			.range([0, height]);
	});
    // Build the X scale -> it find the best position for each Y axis
	x = d3.scalePoint()
        .range([0, width])
        .padding(1)
        .domain(axes);

    function path(d) {
        return d3.line()(axes.map(function(p) { return [x(p), scales[p](d[p])]; }));
    }
    function emptyPath(d) {
        return d3.line()(axes.map(function(p) { return [0, 0]; }));
    }
    // Select all existing bars and bind the data to them
    const lines = svg.selectAll(".line").data(formattedData, (d) => d.ORIGIN_AIRPORT);
  

    // Update existing bars with transitions for position, width, height, and color
    lines
      .transition()
      .duration(1000)
      .attr("d", path);
  
    // Add new bars for any new data points and transition them to their correct position and width
    lines
        .enter()
        .append("path")
        .attr("class", function (d) { return "line " + d.ORIGIN } ) //
        .attr("d", path)
        .style("stroke", (d) => regionColors[stateToRegion[d.ORIGIN_STATE]])
        .style("stroke-width", 1)
        .style("fill", "none")
        .transition()
        .duration(4000);
  
    // Remove any bars that are no longer in the updated data
    lines.exit().transition().duration(100).attr("width", 0).remove();
  
    // Update the y-axis with the new data points
    	// Add axes
    svg.selectAll(".axis")
        .data(axes).enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", (d, i) => "translate(" + x(d) + ")")
        .each(function(d) {
            d3.select(this).call(d3.axisLeft().scale(scales[d]));
        });

// Add labels for ORIGIN_AIRPORT
    svg
        .selectAll(".axis")
        .filter(d => d === "ORIGIN_AIRPORT")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
  
    // Add tooltips to all bars with the movie title as the content
    svg
      .selectAll(".line")
    //   .on("mouseover", handleMouseOver)
    //   .on("mouseout", handleMouseOut)
      .append("title")
      .text((d) => d.ORIGIN_AIRPORT);
  }
  
//   // Function to update the scatter plot with new data
//   function updateScatterPlot(data) {
//     // Select the SVG element of the scatter plot
//     const svg = d3.select("#scatterPlot").select("svg").select("g");
  
//     // Create x, y, and r (radius) scales for the plot
//     const xScale = d3
//       .scaleLinear()
//       .domain([0, d3.max(data, (d) => d.budget)])
//       .range([0, width]);
//     const yScale = d3.scaleLinear().domain([0, 10]).range([height, 0]);
//     const rScale = d3
//       .scaleLinear()
//       .domain([
//         d3.min(globalData, (d) => d.oscar_year),
//         d3.max(globalData, (d) => d.oscar_year),
//       ])
//       .range([5, 15]);
  
//     // Select all existing circles and bind the data to them
//     const circles = svg.selectAll(".circle").data(data, (d) => d.title);
  
//     // Update existing circles with transitions for position and radius
//     circles
//       .transition()
//       .duration(1000)
//       .attr("cx", (d) => xScale(d.budget))
//       .attr("cy", (d) => yScale(d.rating))
//       .attr("r", (d) => rScale(d.oscar_year));
  
//     // Add new circles for any new data points and transition them to their correct position and radius
//     circles
//       .enter()
//       .append("circle")
//       .attr("class", "circle data")
//       .attr("cx", (d) => xScale(d.budget))
//       .attr("cy", (d) => yScale(d.rating))
//       .attr("r", 0)
//       .attr("fill", "steelblue")
//       .attr("stroke", "black")
//       .transition()
//       .duration(500)
//       .attr("r", (d) => rScale(d.oscar_year));
  
//     // Remove any circles that are no longer in the updated data
//     circles.exit().transition().duration(500).attr("r", 0).remove();
  
//     // Update the y-axis with the new data points
//     svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(yScale));
  
//     // Update the x-axis with the new data points, formatting the labels for budget in millions
//     svg
//       .select(".x-axis")
//       .transition()
//       .duration(500)
//       .call(
//         d3
//           .axisBottom(xScale)
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
  
  