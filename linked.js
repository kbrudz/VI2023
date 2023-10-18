function showTooltip(event, d){
    d3.select('#tooltip')
        .transition()
        .style("opacity", 1)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");

    document.getElementById("tooltip")
        .innerHTML= "Airport:" + d.ORIGIN_AIRPORT + "<br>" +
        "Region:" + stateToRegion[d.ORIGIN];
    
    
  }

function hideTooltip(d){
	d3.select('#tooltip')
        .transition().duration(2000)
		.style("opacity", 0)
  }