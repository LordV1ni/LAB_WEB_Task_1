"use strict";

import {
    buyStock, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS, getAllStocks, getUserStocks, hash, initNavigationBar,
    sellStock, updateNavigationBar, UserOwnedStockTypes
} from "./lib.js";

// Portfolio page shows:
//  - user owned stocks
//  - all stocks available
// Implements
//  - Buying stocks

// Update the list of stocks owned by the user
async function updateUserOwnedStocks()
{
    let stocks = await getUserStocks();
    // Get the stocks list
    const env = document.getElementById("div-environment-dynamic-portfolio-list");

    if (stocks.length <= 0)
    {
        env.innerHTML = "<p class='portfolio-empty-message'>Noch keine Aktien gekauft.</p>";
        return;
    }

    // Update the list
    // Grep the row template
    const template = document.getElementById("div-environment-dynamic-portfolio-list__element-row-template");

    // Create a fragment for the new list
    const frag = document.createDocumentFragment();

    stocks.forEach((stock) =>
    {
        // Instance a new row template
        const clone = template.content.cloneNode(true);

        const rowElement = clone.querySelector(".portfolio-row");
        const purchasePrice = UserOwnedStockTypes.stocks.get(stock.name);
        const profit = purchasePrice ? (stock.price - purchasePrice) : null;
        const profitPerShare = profit !== null ? profit : null;
        const totalProfit = profitPerShare !== null ? (profitPerShare * stock.owning) : null;

        // Set content
        clone.querySelector(".portfolio-row__name").textContent = stock.name;
        clone.querySelector(".portfolio-row__price").textContent = parseFloat(stock.price).toFixed(2) + " €";
        clone.querySelector(".portfolio-row__owning").textContent = stock.owning;
        
        // Format profit display
        const profitElement = clone.querySelector(".portfolio-row__profit");
        if (profitPerShare !== null && !isNaN(profitPerShare)) {
            const profitText = profitPerShare >= 0 ? `+${profitPerShare.toFixed(2)}` : profitPerShare.toFixed(2);
            profitElement.textContent = `${profitText} € (${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} € gesamt)`;
        } else {
            profitElement.textContent = "unbekannt";
        }

        // Remove old color classes first
        rowElement.classList.remove("portfolio-row--profit", "portfolio-row--loss");
        
        // Add color class based on profit
        if (profitPerShare !== null && !isNaN(profitPerShare)) {
            if (profitPerShare > 0) {
                rowElement.classList.add("portfolio-row--profit");
            } else if (profitPerShare < 0) {
                rowElement.classList.add("portfolio-row--loss");
            }
        }

        // Quick sell button
        clone.querySelector(".portfolio-row__quick-sell").addEventListener("click", () => {
            placeOwnValuesInSellField(stock);
        });

        frag.appendChild(clone);
    })

    // Clear the old list and append the new fragment
    env.innerHTML = "";
    env.appendChild(frag);
}

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
    const menu = document.getElementById("buy-stock-selection-drop-down");
    // Save the current selected value
    const selected= menu.value;


    menu.innerHTML = "";
    const option = document.createElement("option");
    option.value = "none";
    option.textContent = "Bitte auswählen...";
    menu.appendChild(option);
    STOCKS_AVAILABLE_NAMES.forEach((stock) => {
       const opt = document.createElement("option");
       opt.value = stock.name;
       opt.textContent = stock.name;
       menu.appendChild(opt);
       // Reselect the old value if it is stil available
       if (stock.name === selected) {
           menu.value = selected;
       }
    })
}

async function buy()
{
    const name = document.getElementById("buy-stock-selection-drop-down").value;
    const amount = document.getElementById("buy-stock-selection-amount").value;

    if (name === "none") {
        alert("Bitte eine Aktie auswählen");
        return;
    }


    await buyStock(name, amount);

    // Update ui
    contentLoop();
}

async function sell()
{
    const name = document.getElementById("buy-stock-selection-drop-down").value;
    const amount = document.getElementById("buy-stock-selection-amount").value;

    if (name === "none") {
        alert("Bitte eine Aktie auswählen");
        return;
    }


    await sellStock(name, amount);

    // Update ui
    contentLoop();
}

// Allows the user to clock a row of user owned stocks to load the values into the sell field
async function placeOwnValuesInSellField(stock)
{
    document.getElementById("buy-stock-selection-drop-down").value = stock.name;
    document.getElementById("buy-stock-selection-amount").value = stock.owning;
}

async function init ()
{
    // Load purchase prices from localStorage
    UserOwnedStockTypes.loadFromStorage();
    
    initNavigationBar();
    // Run contentLoop immediately to load data on page load
    await contentLoop();
    startContentLoop();
    registerElementListeners()

}

async function contentLoop()
{
    updateNavigationBar();
    updateUserOwnedStocks();
    updateStockSelectionDropdownList();
    await updateUserOwnedStocks();
    await updateUserOwnedStocks();
}

async function startContentLoop()
{
    setInterval(contentLoop, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
}

async function registerElementListeners()
{
    // Register the buy button
    document.getElementById("buy-stock-action__button__buy").addEventListener('click', buy);
    document.getElementById("buy-stock-action__button__sell").addEventListener('click', sell);
}

window.addEventListener("load", init );