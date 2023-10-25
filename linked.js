function showTooltip(event, d){
    d3.select('#tooltip')
        .transition()
        .style("opacity", 1)
        .style("left", (event.pageX+1) + "px")
        .style("top", (event.pageY+1) + "px");

	const regions = ["west", "south", "midwest", "northeast"];
	if(d.ORIGIN_AIRPORT != null)
		document.getElementById("tooltip")
			.innerHTML= "Airport: " + d.ORIGIN_AIRPORT + "<br>" +
			"Region: " + stateToRegion[d.ORIGIN_STATE] +"<br>" +
			"Delay: " + d.ARR_DELAY_SUM;
	else if(d.date != null){
		document.getElementById("tooltip")
			.innerHTML= "Date: " + d.date + "<br>" +
			"Average Temperature: " + parseFloat(d.avgTempC).toFixed(1) +"ºC" +"<br>" +
			"Average Temperature: " + parseFloat(d.avgTempF).toFixed(1) +"ºF";
	}
    else if (regions.find(v => v == d) != null){
		document.getElementById("tooltip")
			.innerHTML= "Region: " + d;
	}
	else if (d.index != null){
		document.getElementById("tooltip")
			.innerHTML= "Region: " + regions[d.index];
	}
  }

function hideTooltip(d){
	d3.select('#tooltip')
        .transition().duration(2000)
		.style("opacity", 0)
  }
  

	// TODO: Highlight the specie that is hovered
	// function highlight (event, d){
	// 	// console.log("highlight", d);
	// 	// first every group turns grey
	// 	d3.selectAll(".foreground")
	// 	  .transition().duration(200)
	// 	  .style("opacity", "0.2");
	// 	// Second the hovered specie takes its color
	// 	d3.select("." + d.ORIGIN)
	// 	  .transition().duration(200)
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
	// This function is triggered when the mouse pointer is over an element.
function handleMouseOver(event, item) {
	showTooltip(event, item);
	if(item.date || item === undefined || item === null){
		return;
	}
    const regions = ["west", "south", "midwest", "northeast"]; // regions

	// Select all elements with the class "data" using D3.js
	d3.selectAll(".data")
		// Change the "fill" attribute of all the elements to "steelblue".
		.attr("opacity", 0.2);

	var selected;
	if (regions.includes(item))
		selected = item;
	else if(item.index !== undefined)
		selected = regions[item.index];
	else if(item.ORIGIN_AIRPORT !== null)
		selected = stateToRegion[item.ORIGIN_STATE];
	// console.log("logging d item",item, selected);

	d3.selectAll(".data")
	// Filter the selection based on a custom condition.
		.filter(function (d) {
			// console.log("evaluating: ", d);
			if (d === undefined){
				// console.log("undefined");
				return false;
			}
			if( regions.includes(d)){
				// console.log("entered condition 1", d);
				return selected == d;}
			else if(d.source !== undefined){
				// console.log("entered condition 2", d);
				// Return true for elements whose "title" property matches the "title" property of the "item" parameter.
				return selected == regions[d.source.index];}
			else if(d.ORIGIN_AIRPORT !== null){
				// console.log("entered condition 3", d);
				// Return true for elements whose "title" property matches the "title" property of the "item" parameter.
				return selected == stateToRegion[d.ORIGIN_STATE];}
			else{console.log("missing chord element", d);return false;};
		})
	// Change the "fill" attribute of the filtered elements to "red".
	.attr("opacity", 1);
	
  }

  // This function is triggered when the mouse pointer moves out of an element (mouseout event).
function handleMouseOut(event, item) {
	hideTooltip(event, item);

	// Select all elements with the class "data" using D3.js
	d3.selectAll(".data")
	  // Change the "fill" attribute of all the elements to "steelblue".
	  .attr("opacity", 1);
  
  }