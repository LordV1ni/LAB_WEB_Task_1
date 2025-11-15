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
        env.innerHTML = "<p class='div-environment-dynamic-portfolio-list_message'>Noch keine Aktien gekauft.</p>";
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

        clone.querySelector(".div-environment-dynamic-portfolio-list__element-row-template__name").textContent = stock.name;
        clone.querySelector(".div-environment-dynamic-portfolio-list__element-row-template__price").textContent = stock.price;
        clone.querySelector(".div-environment-dynamic-portfolio-list__element-row-template__owning").textContent = stock.owning;
        const profit = (stock.price - UserOwnedStockTypes.stocks.get(stock.name));
        clone.querySelector(".div-environment-dynamic-portfolio-list__element-row-template__profit").textContent = isNaN(profit) ? "unbekannt" : profit;
        clone.querySelector(".div-environment-dynamic-portfolio-list__element-row-template__action__quick-sell").addEventListener("click", () => {
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
    initNavigationBar();
    startContentLoop();
    registerElementListeners()

}

async function contentLoop()
{
    updateNavigationBar();
    updateUserOwnedStocks();
    updateStockSelectionDropdownList();
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