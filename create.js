// Function to create a bar chart
function createStreamGraph(delays, temp) {
    // Select the #streamGraph element and append an SVG to it
    console.log('here1');

    // append the svg object to the body of the page
    const svg = d3
        .select("#streamGraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // // List of groups = header of the csv files
    // const total_delays = d3.rollups(delays, v => d3.sum(v, d => d.DEP_DELAY), d => d.FL_DATE, d => d.ORIGIN_AIRPORT);
    // const delayed = [...total_delays].flatMap(([k1, v1]) => [...v1].map(([k2, v2]) => ({date: k1, airport: k2, delay: v2})))
    // // Add X axis
    // var x = d3.scaleTime()
    //     .domain(d3.extent(delayed, function(d) { return d.date; }))
    //     .range([ 0, width ]);
    // svg.append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x).ticks(5));
    // // console.log('mapping: ', delayed.map(d => console.log(d.delay)));
    
    // // Add Y axis
    // var y = d3.scaleLinear()
    //     .domain([d3.max(total_delays.map(d => d[1][1][1])), d3.min(total_delays.map(d => d[1][1][1]))])
    //     .range([ height, 0 ]);
    // svg.append("g")
    //     .call(d3.axisLeft(y));
    // // console.log('total_delays.map( d  => d[1][1])'+ total_delays.map( d  => d[1][1][1]));

    // // color palette
    // var color = d3.scaleOrdinal()
    //     .domain(delayed.map(d => d.airport))
    //     .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf']);

    // //stack the data?
    // const series = d3.stack()
    //     .offset(d3.stackOffsetWiggle)
    //     .keys(d3.union(delayed.map(d => d.airport))) // apples, bananas, cherries, …
    //     .value(([, group], key) => group.get(key)?.delay || '') 
    //     (total_delays);
    // console.log('here?', delayed.find(d => d.date && d.airport));
    
    // // Show the areas
    // svg
    // .selectAll("path")
    // .data(series)
    // .enter()
    // .append("path")
    //     .style("fill", function(d) { return color(d.key); })
    //     .attr("d", d3.area()
    //         .x(function(d, i) { console.log(x(d.delayed)); return x(d?.delayed?.date || ''); })
    //         .y0(function(d) { return y(d[0]); })
    //         .y1(function(d) { return y(d[1]); })
    //     )
//Read the data
    const total_delays = d3.rollups(delays, v => d3.sum(v, d => d.DEP_DELAY), d => d.FL_DATE, d => d.ORIGIN_AIRPORT);
    const delayed = [...total_delays].flatMap(([k1, v1]) => [...v1].map(([k2, v2]) => ({date: k1, airport: k2, delay: v2})))
    
    // group the data: one array for each value of the X axis.
    const sumstat = d3.group(delays, d => d.FL_DATE);
    console.log(sumstat);
    // Stack the data: each group will be represented on top of each other
    const mygroups = d3.union(delayed.map(d => d.airport)) // list of group names
    const mygroup = d3.union(delayed.map(d => d.date)) // list of group names
    const stackedData = d3.stack()
      .keys(mygroup)
      .value(function(d, key){
        console.log("d1key ",d[1][key]);
        return d[1].DEP_DELAY;
      })
      (sumstat)
  
    // Add X axis --> it is a date format
    const x = d3.scaleLinear()
      .domain(d3.extent(delays, function(d) { return d.FL_DATE; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5));
  
    // Add Y axis
    const y = d3.scaleLinear()
      .domain([d3.min(delays, function(d) { return d.DEP_DELAY; }), d3.max(delays, function(d) { return d.DEP_DELAY; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));
  
    // color palette
    const color = d3.scaleOrdinal()
      .domain(mygroups)
      .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])
  
    // Show the areas
    svg
      .selectAll("mylayers")
      .data(stackedData)
      .join("path")
        // .style("fill", function(d) { n = mygroups[d.key-1] ;  return color(n); })
        .attr("d", d3.area()
            .x(function(d, i) { return x(d.delays[0]); })
            .y0(function(d) { return y(d[0]); })
            .y1(function(d) { return y(d[1]); })
      )
  
    
    console.log('here?last');
}
  
  