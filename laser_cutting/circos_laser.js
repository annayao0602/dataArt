const CircosChart = function CircosChart(selector, main_data, options) {

    // 1. Configuration
    const cfg = {
        margin: {top: 50, right: 50, bottom: 50, left: 50},
        innerRadius: 80,
        outerRadius: 350,
        maxValue: 1500,
        labels: false,
        outlineOnly: false // Toggles between laser cut and solid fill
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
    main_data.forEach((d, i) => {
        d.value = +d.numpub;
        d.uniqueId = d.Field + "-" + i; 
    });

    // 4. Scales
    const x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0)
        .padding(0)
        .domain(main_data.map(d => d.uniqueId));

    const y = d3.scaleLinear()
        .range([cfg.innerRadius, cfg.outerRadius])
        .domain([0, cfg.maxValue])
        .clamp(true);

    const allDomains = [...new Set(main_data.map(d => d.Domain))];
    const domainColor = d3.scaleOrdinal()
        .domain(allDomains)
        .range(["#000000"]);

    // 5. Draw Bars (Static) or Laser Outline
    if (cfg.outlineOnly) {
        
        let pathString = "";
        
        // Helper functions to convert polar to Cartesian
        const getX = (a, r) => r * Math.sin(a);
        const getY = (a, r) => -r * Math.cos(a);

        main_data.forEach((d, i) => {
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
            .data(main_data)
            .enter()
            .append("path")
            .attr("fill", d => domainColor(d.Domain))
            .attr("d", arc)
            .attr("stroke-width", "none");

        
    }

    function toggleAxesVisibility() {}

    return {
        toggle: toggleAxesVisibility
    };
}