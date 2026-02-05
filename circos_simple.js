const CircosChart = function CircosChart(selector, main_data, options) {

    // 1. Configuration
    const cfg = {
        margin: {top: 50, right: 50, bottom: 50, left: 50},
        innerRadius: 80,
        outerRadius: 350,
        maxValue: 1500, // Hard cap
        labels: false
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
    // We add the index 'i' to uniqueId to handle duplicate Field names
    main_data.forEach((d, i) => {
        d.value = +d.numpub;
        d.uniqueId = d.Field + "-" + i; // <--- CHANGED: Ensures every row gets its own bar
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
        .range(["#003f5c", "#bc5090", "#58508d", "#ffa600", "#ef5675", "#7a5195"]);

    // 5. Draw Bars (Static)
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
        .attr("stroke", "white")
        .attr("stroke-width", 0.1);

    // 6. Draw Plus Signs for Overflow
    const overflowData = main_data.filter(d => d.value > cfg.maxValue);
    
    svg.append("g")
        .selectAll("text")
        .data(overflowData)
        .enter()
        .append("text")
        .text("+")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("fill", d => domainColor(d.Domain))
        .attr("transform", d => {
            const angle = (x(d.uniqueId) + x.bandwidth() / 2) * 180 / Math.PI - 90;
            const r = cfg.outerRadius + 8; 
            return `rotate(${angle}) translate(${r},0)`;
        });

    function toggleAxesVisibility() {}

    return {
        toggle: toggleAxesVisibility
    };
}