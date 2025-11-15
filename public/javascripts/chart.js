"use strict";

import {
    initNavigationBar,
    updateNavigationBar,
    DYNAMIC_UI_UPDATE_INTERVAL_IN_MS, getAllStocks, hash, GLOBAL_STOCK_TRENDS
} from "./lib.js";

let STOCKS_AVAILABLE_NAMES = [];

// Update the list of stocks available for purchase (names)
async function queryAvailableStocks()
{
    STOCKS_AVAILABLE_NAMES = await getAllStocks();
}

// Calculate a hash over the available stock names
async function hashAvailableStocks()
{
    const temp = [];
    STOCKS_AVAILABLE_NAMES.forEach(stock => {
        temp.push(stock.name);
    })
    return await hash(temp);
}

async function updateStockSelectionDropdownList()
{

    const old_hash = await hashAvailableStocks();
    await queryAvailableStocks();
    // Only update the dropdown if the list of available stocks has changed
    const new_hash = await hashAvailableStocks();
    if (old_hash === new_hash) return;
    const menu = document.getElementById("chart__select-symbol");
    // Save the current selected value
    const selected= menu.value;


    menu.innerHTML = "";
    const option = document.createElement("option");
    option.value = "all";
    option.textContent = "Alle anzeigen";
    menu.appendChild(option);
    STOCKS_AVAILABLE_NAMES.forEach((stock) => {
        const opt = document.createElement("option");
        opt.value = stock.name;
        opt.textContent = stock.name;
        menu.appendChild(opt);
        // Reselect the old value if it is still available
        if (stock.name === selected) {
            menu.value = selected;
        }
    })
}

async function updateGraph()
{
    drawLineGraph();
}

// #### LINE GRAPH HANDLING
async function drawLineGraph()
{
    const canvas = document.getElementById('chart__display__line-graph-canvas');
    // Get the displayed size
    const rect = canvas.getBoundingClientRect();

    // Set internal canvas resolution to match displayed size
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');


    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = [
        'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet',
        'pink', 'cyan', 'magenta', 'lime', 'teal', 'brown', 'gray'
    ];

    let data = []
    let i = 0
    GLOBAL_STOCK_TRENDS.forEach((trend, name) => {
        data.push({color: colors[i%colors.length], points:trend, label: name});
        i++;
    })

    // Find the range for scaling
    const allX = data.flatMap(line => line.points.map(p => p.x));
    const allY = data.flatMap(line => line.points.map(p => p.y));
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);

    // Convert data points to canvas coordinates
    function toCanvasX(x) {
        return ((x - minX) / (maxX - minX)) * canvas.width;
    }
    function toCanvasY(y) {
        return canvas.height - ((y - minY) / (maxY - minY)) * canvas.height;
    }

    // Get the selected display option
    const option = document.getElementById("chart__select-symbol").value;
    // Handle edge cases
    if (option === "null") return;
    if (option !== "all") {
        // Filter the list for only the selected stock
        data = data.filter(x => x.label === option);
    }

    // Draw each line
    data.forEach(line => {
        ctx.beginPath();
        ctx.strokeStyle = line.color;

        line.points.forEach((point, i) => {
            const cx = toCanvasX(point.x);
            const cy = toCanvasY(point.y);
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        });
        ctx.stroke();

        //console.log("Drawing line " + line.label + " " + JSON.stringify(line.points));

        // Draw label near the last point of the line
        const padding = 10; // pixels

        const lastPoint = line.points[line.points.length - 1];
        if (lastPoint) {
            let labelX = toCanvasX(lastPoint.x) + 5; // right of last point
            let labelY = toCanvasY(lastPoint.y);

            // Keep label inside canvas boundaries
            if (labelX + 115 > canvas.width) labelX = canvas.width - 115; // adjust right edge
            if (labelY - 7 < 0) labelY = 7; // top padding
            if (labelY + 7 > canvas.height) labelY = canvas.height - 7; // bottom padding

            ctx.fillStyle = line.color;
            ctx.font = "14px Arial";
            ctx.textBaseline = "middle";
            ctx.fillText(line.label, labelX, labelY);
        }
    });

}
// ########################

async function init ()
{
    initNavigationBar();
    startContentLoop();

}

async function contentLoop()
{
    updateNavigationBar();
    updateStockSelectionDropdownList();
    updateGraph();
}

async function startContentLoop()
{
    setInterval(contentLoop, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
}

window.addEventListener("load", init );