"use strict";

// GLOBAL

export const SERVER_BASE_URL = ".";        // Without trailing slash!
//export const SERVER_BASE_URL = "https://ypdpbec5rmupizpk.myfritz.net/lab-web-a-1";        // Without trailing slash!
export const LOGGING = {
    verbose: false,
    warn: true,
    error: true
}
export const DYNAMIC_UI_UPDATE_INTERVAL_IN_MS = 500;

export let BALANCE_START = null;

export let BALANCE = 0;
export let USERNAME = "";

// Global UI

// Initialize the data of the top navigation bar
export async function initNavigationBar()
{
    const display_name = document.querySelector("#display_name .user-name");
    const display_balance = document.querySelector("#display_balance .balance-value");

    // Get the user data
    const user = await getUser();
    display_name.textContent = user.name;
    display_balance.textContent = parseFloat(user.balance).toFixed(2);
}

// Update the data of the top navigation bar
export async function updateNavigationBar()
{
    const display_balance = document.querySelector("#display_balance .balance-value");

    // Get the user data
    const user = await getUser();
    display_balance.textContent = parseFloat(user.balance).toFixed(2);
}

export async function alertCustom(message)
{
    const dialog = document.getElementById("alert");
    document.getElementById("alert-body").innerHTML = message;
    document.getElementById("alert-dismiss").addEventListener("click", () => {
        dialog.close();
    })

    dialog.showModal();
}

// Util

// Calculate a simple hash over a string
export async function hash(str) {
    let hash = 0;
    for (const char of str) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0; // Constrain to 32bit integer
    }
    return hash;
}

// @Jenkins start-block-remove-on-publish
// Log something to the console
export const Log = Object.freeze({
    log(message)
    {
        if (LOGGING.verbose) console.log(message);
    },
    warning(message)
    {
        if (LOGGING.warn) console.log(message);
    },
    error(message)
    {
        if (LOGGING.error) console.log(message);
    }
})
// @Jenkins end-block-remove-on-publish

// Send a get request to the server
export async function getRequestToServe(endpoint)
{
    Log.log(`Requesting GET ${endpoint}`);                                  // @Jenkins line-remove-on-publish
    try
    {
        const response = await fetch(SERVER_BASE_URL + endpoint)
        Log.log(`Response is ${response.ok}`);                            // @Jenkins line-remove-on-publish
        if (!response.ok)
        {
            return new ServerPacket(false, `${response.statusText} (${response.status})`, response);
        }
        return new ServerPacket(true, "", response);        // Empty message on success, might change later...
    }catch (exception)
    {
        return new ServerPacket(false, exception.message, null);
    }
}

// Classes

export class User
{
    constructor(name, balance)
    {
        this.name = name;
        this.balance = balance;
    }
}

// Container for a response form the server
export class ServerPacket
{
    constructor(status, message, payload)
    {
        this.status = status;
        this.message = message;
        this.payload = payload;
    }
    get ok() {
        return this.status;
    }
}

export const UserOwnedStockTypes =
{
    stocks: new Map(),
    
    // Load purchase prices from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('stockPurchasePrices');
            if (stored) {
                const prices = JSON.parse(stored);
                Object.entries(prices).forEach(([name, data]) => {
                    this.stocks.set(name, data.averagePrice);
                });
            }
        } catch (e) {
            console.warn('Failed to load purchase prices from localStorage:', e);
        }
    },
    
    // Save purchase prices to localStorage
    saveToStorage() {
        try {
            const prices = {};
            this.stocks.forEach((price, name) => {
                prices[name] = { averagePrice: price };
            });
            localStorage.setItem('stockPurchasePrices', JSON.stringify(prices));
        } catch (e) {
            console.warn('Failed to save purchase prices to localStorage:', e);
        }
    },
    
    // Update purchase price with weighted average when buying more shares
    updatePurchasePrice(stockName, newPrice, newAmount, existingAmount = 0) {
        const existingPrice = this.stocks.get(stockName);
        
        if (existingPrice && existingAmount > 0) {
            // Calculate weighted average: (oldPrice * oldAmount + newPrice * newAmount) / (oldAmount + newAmount)
            const totalAmount = existingAmount + newAmount;
            const weightedAverage = (existingPrice * existingAmount + newPrice * newAmount) / totalAmount;
            this.stocks.set(stockName, weightedAverage);
        } else {
            // First purchase or no existing shares
            this.stocks.set(stockName, newPrice);
        }
        
        this.saveToStorage();
    }
}

// Load purchase prices from localStorage on module load
// This ensures prices are available on all pages
if (typeof window !== 'undefined') {
    // Use DOMContentLoaded to ensure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UserOwnedStockTypes.loadFromStorage();
        });
    } else {
        // DOM already loaded, load immediately
        UserOwnedStockTypes.loadFromStorage();
    }
}

// Class representing a single stock
export class Stock
{
    constructor(name, price, number, owning = 0)
    {
        this.name = name;
        this.price = price;
        this.number = number;
        this.owning = owning;
    }
}



export class News
{
    constructor(timestamp, time, text)
    {
        this.timestamp = timestamp;
        this.time = time;
        this.text = text;
    }
}

export class Message
{
    constructor(date, sender, recipient, text)
    {
        this.date = date;
        this.sender = sender;
        this.text = text;
        this.recipient = recipient;
    }
}

// Error during server communication
export class ServerException extends Error
{
    constructor(message, userMessage)
    {
        super(message);
        this.userMessage = userMessage;
        this.name = "ServerError";
    }
}

// Set methods (POST)

// Buy stocks from the market
export async function buyStock(stock, amount = 1)
{
    try
    {
        // Make a post request to the server
        const response = await fetch(SERVER_BASE_URL + "/api/account/positions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                stock: {
                    name: stock
                },
                number: amount
            })
        })

        // Check response
        if (!response.ok) {
            if (response.status === 422) {
                alertCustom(`Cant buy stock "${stock}": ${(await response.json()).error}`);
                return;
            }
            else {
                alertCustom(`Could not buy stock ${stock}: ${response.statusText}`);
                return;
            }
        }

        const json = await response.json();
        // Get current owned amount to calculate weighted average
        const currentStocks = await getUserStocks();
        const currentStock = currentStocks.find(s => s.name === stock);
        const existingAmount = currentStock ? currentStock.owning - amount : 0; // Subtract because we're adding
        
        // Update purchase price with weighted average
        UserOwnedStockTypes.updatePurchasePrice(stock, json.sales.stock.price, amount, existingAmount);
    }catch (exception)
    {
        alertCustom("Buying the stock failed: " + exception.message);
    }
}

export async function sellStock(stock, amount = 1)
{
    try
    {
        // Make a post request to the server
        const response = await fetch(SERVER_BASE_URL + "/api/account/positions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                stock: {
                    name: stock
                },
                number: amount * -1
            })
        })

        // Check response
        if (!response.ok) {
            if (response.status === 422) {
                alertCustom(`Cant sell stock "${stock}": ${(await response.json()).error}`);
                return;
            }
            else {
                alertCustom(`Could not sell stock ${stock}: ${response.statusText}`);
                return;
            }
        }

        // After selling, check if all shares are sold and remove purchase price if so
        const currentStocks = await getUserStocks();
        const currentStock = currentStocks.find(s => s.name === stock);
        if (!currentStock || currentStock.owning <= 0) {
            // All shares sold, remove purchase price
            UserOwnedStockTypes.stocks.delete(stock);
            UserOwnedStockTypes.saveToStorage();
        }

    }catch (exception)
    {
        alertCustom("Selling the stock failed: " + exception.message);
    }
}

// Send a message to one or more players
export async function sendMessage(recipient, text)
{
    // Split for multiple recipients
    const recipients = recipient.split(",");

    recipients.forEach(async (recipient) => {
        // Send the message
        // Skip empty entrys
        if (recipient === "") return;
        try
        {
            // Make a post request to the server
            const response = await fetch(SERVER_BASE_URL + "/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    recipient: recipient,
                    message: text
                })
            })

            // Check response
            if (!response.ok) {
                if (response.status === 422) alertCustom(`Cant send message: ${(await response.json()).error}`);
                else alertCustom(`Could not send message: ${response.statusText} (${response.status})`);
            }

            // Update all dynamic ui immediately to make sure all changes are visible
            uiUpdateDynamic();

        }catch (exception)
        {
            alertCustom("Sending the message failed: " + exception.message);
        }
    })
}

// Get methods

// Get the current user as a object of type user
export async function getUser()
{
    // Get the user data from the server
    const packet = await getRequestToServe("/api/user");
    if(packet.ok)
    {
        const json = await packet.payload.json();
        Log.log(`User data is ${json}`);                  // @Jenkins line-remove-on-publish
        USERNAME = json.name;
        return new User(json.name, json.balance);
    }
    alertCustom("Unable to get user: " + packet.message);
    return {};
}

// Get all users as a list of user objects
export async function getAllUsers()
{
    // Get the user data from the server
    const packet = await getRequestToServe("/api/user/everybody");
    if(packet.ok)
    {
        const json = await packet.payload.json();
        Log.log(`User data is ${json}`);                  // @Jenkins line-remove-on-publish
        // Build list of user data
        const users = []
        json.forEach(user => users.push(new User(user.name, user.sum)));
        return users;
    }
    alertCustom("Unable to get users: " + packet.message);
    return {};
}

// Get all available stocks on the market
export async function getAllStocks()
{
    const packet = await getRequestToServe("/api/stocks");
    if(packet.ok)
    {
        //Build a list of all available stocks
        const stocks = [];
        const json = await packet.payload.json();
        json.forEach(stock => stocks.push(new Stock(stock.name, stock.price, stock.numberAvailable)));
        Log.log(`Available stock list is ${stocks}`);                  // @Jenkins line-remove-on-publish
        return stocks;
    }
    Log.log(`Stock market fetch failed`);                  // @Jenkins line-remove-on-publish
    alertCustom("Unable to get stocks: " + packet.message);
    return {};
}

// Get all available stocks owned by the user
export async function getUserStocks()
{
    const packet = await getRequestToServe("/api/account");
    if(packet.ok)
    {
        //Build a list of all available stocks
        let stocks = [];
        const json = (await packet.payload.json()).positions;
        json.forEach(stock => stocks.push(new Stock(stock.stock.name, stock.stock.price, stock.stock.numberAvailable, stock.number)));
        Log.log(`Available stock list is ${stocks}`);                  // @Jenkins line-remove-on-publish
        stocks.sort((a, b) => a.owning - b.owning);
        stocks = stocks.filter((stock) => stock.owning > 0);        // Filter stocks the user dosent own
        return stocks;
    }
    Log.log(`Account fetch failed`);                  // @Jenkins line-remove-on-publish
    alertCustom("Unable to get account data: " + packet.message);
    return {};
}

// Get the last n news messages
export async function getNews(n)
{
    const packet = await getRequestToServe("/api/news?lastTime=0000000000000");
    if(packet.ok)
    {
        //Build a list of all available news messages
        const news = [];
        let json = await packet.payload.json();
        // Get only the last n
        json = json.slice(-n)
        json.forEach(message => news.push(new News(message.timestamp, message.time, message.text)));
        Log.log(`Available news list is ${news}`);                  // @Jenkins line-remove-on-publish
        return news;
    }
    Log.log(`News fetch failed`);                  // @Jenkins line-remove-on-publish
    alertCustom("Unable to get news: " + packet.message);
    return {};
}

// Get the last n messages
export async function getMessages(n)
{
    const packet = await getRequestToServe("/api/messages?lastTime=0000000000000");
    if(packet.ok)
    {
        //Build a list of all available messages
        const messages = [];
        let json = await packet.payload.json();
        // Get only the last n
        json = json.slice(-n)
        json.forEach(message => messages.push(new Message(message.date, message.sender, message.recipient, message.text)));
        Log.log(`Available message list is ${messages}`);                  // @Jenkins line-remove-on-publish
        messages.sort((a, b) => a.date - b.date);
        return messages;
    }
    Log.log(`Messages fetch failed`);                  // @Jenkins line-remove-on-publish
    alertCustom("Unable to get messages: " + packet.message);
    return {};
}