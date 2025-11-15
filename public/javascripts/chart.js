"use strict";

import {
    initNavigationBar,
    updateNavigationBar,
    DYNAMIC_UI_UPDATE_INTERVAL_IN_MS, getAllStocks, hash, getNews, USERNAME
} from "./lib.js";
import {
    GLOBAL_STOCK_TRENDS
} from "./engine.js";

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
    
    // Handle empty data case
    if (allX.length === 0 || allY.length === 0) {
        updateChartScales(0, 0, 0, 0);
        return;
    }
    
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    
    // Update chart scales
    updateChartScales(minX, maxX, minY, maxY);

    // Convert data points to canvas coordinates
    // Verschiebe die X-Koordinaten, damit sie mit der verschobenen X-Achse übereinstimmen
    const timeRange = maxX - minX;
    const tickInterval = timeRange / 5; // 5 Ticks auf der X-Achse
    const adjustedMinX = minX + tickInterval; // Starte beim zweiten Tick
    
    function toCanvasX(x) {
        // Normalisiere relativ zum verschobenen Startpunkt
        return ((x - adjustedMinX) / (maxX - adjustedMinX)) * canvas.width;
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

// Update chart scales (X-axis for time only, Y-axis removed)
function updateChartScales(minX, maxX, minY, maxY) {
    // Y-axis (price scale) wurde entfernt - nur X-axis wird aktualisiert
    
    // Update X-axis (time scale)
    const xAxis = document.getElementById('chart-x-axis');
    if (!xAxis) return;
    
    const numXTicks = 5; // Number of ticks on X-axis
    xAxis.innerHTML = '';
    
    if (maxX > minX) {
        // Verschiebe die Ticks so, dass der erste Tick dort ist, wo vorher der zweite war
        // Wir erstellen numXTicks + 1 Ticks, aber zeigen nur die letzten numXTicks an
        const timeRange = maxX - minX;
        const tickInterval = timeRange / numXTicks;
        
        // Starte bei minX + tickInterval (also beim zweiten ursprünglichen Tick)
        for (let i = 0; i <= numXTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'chart-x-axis__tick';
            // Beginne bei minX + tickInterval statt minX
            const timestamp = minX + tickInterval + (tickInterval * i);
            const date = new Date(timestamp);
            // Format: HH:MM:SS
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            tick.textContent = `${hours}:${minutes}:${seconds}`;
            xAxis.appendChild(tick);
        }
    }
}
// ########################

// Update the displayed messages with the last 20? news
async function updateNewsDisplay()
{
    // Get the last 20? available messages
    const messages = await getNews(20);

    // Get the environment
    const env = document.getElementById("chart__display__list-news");

    if(messages.length <= 0)
    {
        env.innerHTML = "<p class='chart-news-empty'>Noch keine Aktivitäten.</p>";
        return;
    }

    // Update the list
    // Grep the row template
    const template = document.getElementById("chart__display__list-news__row-template");

    // Create a fragment for the new list
    const frag = document.createDocumentFragment();

    messages.forEach((message) =>
    {
        // Instance a new row template
        const clone = template.content.cloneNode(true);

        clone.querySelector(".chart__display__list-news__row-template__display-time").textContent = message.time;
        clone.querySelector(".chart__display__list-news__row-template__display-text").textContent = message.text;

        // Get the toplevel element of the clone, because querySelector doesn't work for that
        const userElement = Array.from(clone.childNodes)
            .find(node => node.nodeType === Node.ELEMENT_NODE &&
                node.classList.contains("chart__display__list-news__row-template"));

        // Assign a class based on message origin
        if (message.text.includes(USERNAME))
        {
            userElement.classList.add("chart__display__list-news__row-template__self");
        }else
        {
            userElement.classList.add("chart__display__list-news__row-template__foreign");
        }

        // Assign a class based on message type
        if (message.text.includes("VERKAUF"))
        {
            userElement.classList.add("chart__display__list-news__row-template__sell");
        }else
        {
            userElement.classList.add("chart__display__list-news__row-template__buy");
        }

        frag.appendChild(clone);
    })

    // Clear the old list and append the new fragment
    env.innerHTML = "";
    env.appendChild(frag);
}

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
    updateNewsDisplay();
}

async function startContentLoop()
{
    setInterval(contentLoop, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
}

window.addEventListener("load", init );