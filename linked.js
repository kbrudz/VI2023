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
  }

function hideTooltip(d){
	d3.select('#tooltip')
        .transition().duration(2000)
		.style("opacity", 0)
  }
  