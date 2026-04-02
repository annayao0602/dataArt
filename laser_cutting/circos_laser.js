const CircosChart = function CircosChart(selector, main_data, options) {

    // 1. Configuration
    const cfg = {
        margin: {top: 50, right: 50, bottom: 50, left: 50},
        innerRadius: 80,
        outerRadius: 350,
        maxValue: 1500,
        labels: false,
        outlineOnly: false, // Toggles between laser cut and solid fill
        outerArc: false
    }

    // Adjust width/height based on container
    cfg.width = 900 - cfg.margin.left - cfg.margin.right;
    cfg.height = 800 - cfg.margin.top - cfg.margin.bottom;
    
    const chartRadius = Math.min(cfg.width, cfg.height) / 2;
    cfg.outerRadius = chartRadius;

    if('undefined' !== typeof options){
        for(var i in options){
          if('undefined' !== typeof options[i]){ 
            cfg[i] = options[i]; }
        }
    }

    // 2. Setup SVG
    d3.select(selector).select("svg").remove(); 

    const svg = d3.select(selector)
        .append("svg")
            .attr("width", cfg.width + cfg.margin.left + cfg.margin.right)
            .attr("height", cfg.height + cfg.margin.top + cfg.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + (cfg.width / 2 + cfg.margin.left) + "," + (cfg.height / 2 + cfg.margin.top) + ")");

    // 3. Process Data
    const filtered_data = main_data.filter(d => +d.numpub >= 200);

    filtered_data.forEach((d, i) => {
        d.value = +d.numpub;
        d.uniqueId = d.Field + "-" + i; 
    });

    // 4. Scales
    const x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0)
        .padding(0)
        .domain(filtered_data.map(d => d.uniqueId));

    const y = d3.scaleLinear()
        .range([cfg.innerRadius, cfg.outerRadius])
        .domain([0, cfg.maxValue])
        .clamp(true);

    const allDomains = [...new Set(filtered_data.map(d => d.Domain))];
    const domainColor = d3.scaleOrdinal()
        .domain(allDomains)
        .range(["#000000"]);
    
    if (!cfg.outlineOnly) {
        if (cfg.outerArc) {
            const yAxisGroup = svg.append("g").attr("class", "axis");
            const gridData = y.ticks(8).slice(1);

            yAxisGroup.selectAll(".grid-circle")
                .data(gridData)
                .enter().append("circle")
                .attr("class", "grid-circle")
                .attr("r", d => y(d))
                .style("fill", "none")
                .style("stroke", "#0000ff")
                .style("stroke-dasharray", "2,2")
                .style("stroke-width", "0.5px");

            yAxisGroup.selectAll(".axis-label")
                .data(gridData)
                .enter().append("text")
                .attr("class", "axis-label")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .text((d, i) => {
                    // Show every other label to prevent crowding
                    if ((i + 1) % 2 === 0) {
                        return d3.format(".1s")(d);
                    }
                    return "";
                })
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .style("font-family", "Jura, sans-serif")
                .style("fill", "#0000ff")
                .style("opacity", 1);

            // --- 6. OUTER ARC (BLUE OUTLINE ONLY) ---
            const groupedData = d3.nest()
                .key(d => d.Group)
                .entries(filtered_data);

            groupedData.forEach(group => {
                group.startAngle = x(group.values[0].uniqueId);
                
                const lastFieldInGroup = group.values[group.values.length - 1].uniqueId;
                group.endAngle = x(lastFieldInGroup) + x.bandwidth();
            });

            const ideogramArc = d3.arc()
                .innerRadius(cfg.outerRadius + 11)
                .outerRadius(cfg.outerRadius + 16);

            const ideogramGroup = svg.append("g").attr("class", "ideogram-group");

            ideogramGroup.selectAll("path")
                .data(groupedData)
                .enter().append("path")
                .attr("d", d => ideogramArc({ startAngle: d.startAngle, endAngle: d.endAngle }))
                .style("fill", "none")
                .style("stroke", "#000000")
                .style("stroke-width", "1px");
        }
}

    // 5. Draw Bars (Static) or Laser Outline
    if (cfg.outlineOnly) {
        
        let pathString = "";
        
        // Helper functions to convert polar to Cartesian
        const getX = (a, r) => r * Math.sin(a);
        const getY = (a, r) => -r * Math.cos(a);

        filtered_data.forEach((d, i) => {
            const startAngle = x(d.uniqueId);
            const endAngle = startAngle + x.bandwidth();
            const radius = y(d.value);

            if (i === 0) {
                pathString += `M ${getX(startAngle, radius)} ${getY(startAngle, radius)}`;
            } else {
                pathString += `L ${getX(startAngle, radius)} ${getY(startAngle, radius)}`;
            }

            // Draw the curved arc
            pathString += ` A ${radius} ${radius} 0 0 1 ${getX(endAngle, radius)} ${getY(endAngle, radius)}`;
        });

        pathString += " Z"; // Close path

        const laserGroup = svg.append("g");

        // Outer silhouette
        laserGroup.append("path")
            .attr("d", pathString)
            .style("fill", "none")
            .style("stroke", "#ff0000") // Red for laser
            .style("stroke-width", "1px");

        // Inner circle cutout
        laserGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", cfg.innerRadius)
            .style("fill", "none")
            .style("stroke", "#ff0000") // Red for laser
            .style("stroke-width", "1px");

    } else {
        // --- ORIGINAL SOLID BAR LOGIC ---
        const arc = d3.arc()
            .innerRadius(cfg.innerRadius)
            .outerRadius(d => y(d.value))
            .startAngle(d => x(d.uniqueId))
            .endAngle(d => x(d.uniqueId) + x.bandwidth())
            .padAngle(0)
            .padRadius(cfg.innerRadius);

        svg.append("g")
            .selectAll("path")
            .data(filtered_data)
            .enter()
            .append("path")
            .attr("fill", d => domainColor(d.Domain))
            .attr("d", arc)
            .style("stroke", "none");

        
    }


    function toggleAxesVisibility() {}

    return {
        toggle: toggleAxesVisibility
    };
}