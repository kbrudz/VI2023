function showTooltip(event, d){
	d3.select('#tooltip')
		.transition()
		.style("opacity", 1)

	if(d.ORIGIN_AIRPORT)
		document.getElementById("tooltip")
			.innerHTML= "Airport: " + d.ORIGIN_AIRPORT + "<br>" +
				"Region: " + stateToRegion[d.ORIGIN_STATE] +"<br>" +
				"Delay: " + d.ARR_DELAY_SUM;
	else if(d.date)
		document.getElementById("tooltip")
			.innerHTML= "Date: " + d.date + "<br>" +
				"Average Temperature: " + parseFloat(tempUnit == "C" ? d.avgTempC : d.avgTempF).toFixed(1) +
				(tempUnit == "C" ? "º" : "") + tempUnit;
	else if(globalRegions.find(v => v == d) != null)
		document.getElementById("tooltip")
			.innerHTML= "Region: " + d;
	else if (d.index != null)
		document.getElementById("tooltip")
			.innerHTML= "Region: " + globalRegions[d.index];
}

function hideTooltip(d){
	d3.select('#tooltip')
    .transition().duration(250)
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
	if(item.date || !item) return;

	// Select all elements with the class "data" using D3.js
	d3.selectAll(".data").attr("opacity", 0.1);
	d3.selectAll("path.chord").attr("opacity", 0.08);

	let selected;
	if (globalRegions.includes(item))
		selected = item;
	else if(item.index !== undefined)
		selected = globalRegions[item.index];
	else if(item.ORIGIN_AIRPORT !== null)
		selected = stateToRegion[item.ORIGIN_STATE];

	d3.selectAll(".data")
		.filter((d) => {
			if (d === undefined) return false;
			else if(globalRegions.includes(d)) return selected == d;
			else if(d.index !== undefined) return selected == globalRegions[d.index];
			else if(d.ORIGIN_AIRPORT !== null) return selected == stateToRegion[d.ORIGIN_STATE];
			else return false;
		})
		.attr("opacity", 1);

	d3.selectAll("path.chord").filter((d =>
		selected === globalRegions[d.source.index] || selected === globalRegions[d.target.index]
	))
	.attr("opacity", 0.8);
	
}

  // This function is triggered when the mouse pointer moves out of an element (mouseout event).
function handleMouseOut(event, item) {
	hideTooltip(event, item);
	d3.selectAll(".data").attr("opacity", 1);
	d3.selectAll("path.chord").attr("opacity", 0.8);
}