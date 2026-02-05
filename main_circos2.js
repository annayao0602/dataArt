// main_circos.js

// Configuration
const startYear = 2010;
const endYear = 2025;
const container = d3.select("#my_dataviz"); // Ensure this ID exists in your HTML

// Clear previous content and set up Grid Style
container.html(""); 
container.style("display", "grid")
         .style("grid-template-columns", "repeat(auto-fit, minmax(300px, 1fr))")
         .style("gap", "20px")
         .style("padding", "20px");

// Loop through years
const years = d3.range(startYear, endYear + 1);

years.forEach(year => {
    // 1. Create a wrapper for each chart
    const wrapper = container.append("div")
        .style("text-align", "center")
        .style("border", "1px solid #eee")
        .style("border-radius", "8px")
        .style("background", "#fff");

    // Add Year Label
    wrapper.append("h3")
        .text(year)
        .style("font-family", "Jura")
        .style("margin", "10px 0 0 0");

    // Create unique ID
    const chartId = "chart-" + year;
    wrapper.append("div").attr("id", chartId);

    // 2. Load Data and Render
    d3.csv(`/Users/annayao/dataArt/timeline_data/uva_data_${year}.csv`, function(error, data) {
        if (error) {
            console.log(`No data for ${year}`);
            return;
        }

        // Initialize Circos with smaller dimensions for the grid
        CircosChart("#" + chartId, data, {
            width: 300,
            height: 300,
            innerRadius: 40,
            outerRadius: 130,
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            maxValue: 1500
        });
    });
});