"use strict"

/**
 * Handle long-running global processes
 */
import {DYNAMIC_UI_UPDATE_INTERVAL_IN_MS, getAllStocks} from "./lib.js";

let GLOBAL_STOCK_DATA_PROCESS_RUNNING = false;
const MAX_STOCK_TREND_HISTORY_LENGTH = 200;

// Capture the global stock trends over the entire running time of the client
export const GLOBAL_STOCK_TRENDS = new Map();

// Update the values inside the global stock trends map
async function updateGlobalStockTrends()
{
    const stockData = await getAllStocks();
    // Place the data into the global stock trends map
    const timestamp = Date.now();
    stockData.forEach(stock => {
        if (GLOBAL_STOCK_TRENDS.has(stock.name))
        {
            GLOBAL_STOCK_TRENDS.get(stock.name).push({x:timestamp,y:stock.price});
            // Truncate the list if it gets to long
            if (GLOBAL_STOCK_TRENDS.get(stock.name).length > MAX_STOCK_TREND_HISTORY_LENGTH)
            {
                GLOBAL_STOCK_TRENDS.set(stock.name, GLOBAL_STOCK_TRENDS.get(stock.name).slice(-MAX_STOCK_TREND_HISTORY_LENGTH));
            }
        }else
        {
            GLOBAL_STOCK_TRENDS.set(stock.name, [{x:timestamp,y:stock.price}]);
        }
    })

    // Save the data to local storage for persistence
    await saveStockTrendsToLocalStorage();
}

async function startGlobalStockDataPolling()
{
    if (!GLOBAL_STOCK_DATA_PROCESS_RUNNING)
    {
        setInterval(updateGlobalStockTrends, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
        GLOBAL_STOCK_DATA_PROCESS_RUNNING = true;
    }
}

// Local storage export and import

// Save the stock data to the local storage
async function saveStockTrendsToLocalStorage() {
    const trendsArray = Array.from(GLOBAL_STOCK_TRENDS.entries());
    localStorage.setItem('GLOBAL_STOCK_TRENDS', JSON.stringify(trendsArray));
}

// Load the stock data from local storage
async function loadStockTrendsFromLocalStorage() {
    const saved = localStorage.getItem('GLOBAL_STOCK_TRENDS');
    if (saved) {
        const trendsArray = JSON.parse(saved);
        GLOBAL_STOCK_TRENDS.clear();
        for (const [k, v] of trendsArray) {
            GLOBAL_STOCK_TRENDS.set(k, v);
        }
        console.log("Engine loaded local storage data")
    }else
    {
        console.log("Engine could not load local storage data")
    }
}

export async function start(){
    loadStockTrendsFromLocalStorage();
    startGlobalStockDataPolling();
}

start();