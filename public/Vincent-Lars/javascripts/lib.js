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
    get htmlRepresentation()
    {
        const element = document.createElement("p");
        element.classList.add("user");
        element.innerHTML = `${this.name} | ${this.balance}`;
        return element;
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
    get htmlRepresentation()
    {
        const element = document.createElement("p");
        element.classList.add("stock-market-element");
        this.buy = document.createElement("button");
        this.buy.innerText = "Buy";
        this.buyAmount = document.createElement("button");
        this.buyAmount.innerText = "Buy amount";
        element.innerHTML = `${this.name} | ${this.price} | ${this.number} | `;
        element.appendChild(this.buy);
        element.appendChild(this.buyAmount);
        return element;
    }
    get htmlRepresentationUserList()
    {
        const element = document.createElement("p");
        element.classList.add("userstock-element");
        this.sell = document.createElement("button");
        this.sellAmount = document.createElement("button");
        this.sellAll = document.createElement("button");
        this.sell.innerText = "Sell";
        this.sellAmount.innerText = "Sell amount";
        this.sellAll.innerText = "Sell all";
        element.innerHTML = `${this.name} | ${this.price} | ${this.number} | ${this.owning} | ${UserOwnedStockTypes.stocks.has(this.name) ? this.price - UserOwnedStockTypes.stocks.get(this.name) : "N.a."} | `;
        element.appendChild(this.sell);
        element.appendChild(this.sellAmount);
        element.appendChild(this.sellAll);
        return element;
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
    get htmlRepresentation()
    {
        const element = document.createElement("p");
        element.classList.add("news-element");
        element.innerHTML = `${this.time} | ${this.text}`;
        return element;
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
    get htmlRepresentation()
    {
        const element = document.createElement("p");
        element.classList.add("message-element");
        element.innerHTML = `From: "${this.sender}" to "${this.recipient}" | ${this.text}`;
        return element;
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
                alert(`Cant buy stock "${stock}": ${(await response.json()).error}`);
                return;
            }
            else {
                alert(`Could not buy stock ${stock}: ${response.statusText}`);
                return;
            }
        }

        // Update all dynamic ui immediately to make sure all changes are visible
        uiUpdateDynamic();

        const json = await response.json();
        // Get current owned amount to calculate weighted average
        const currentStocks = await getUserStocks();
        const currentStock = currentStocks.find(s => s.name === stock);
        const existingAmount = currentStock ? currentStock.owning - amount : 0; // Subtract because we're adding
        
        // Update purchase price with weighted average
        UserOwnedStockTypes.updatePurchasePrice(stock, json.sales.stock.price, amount, existingAmount);
    }catch (exception)
    {
        alert("Buying the stock failed: " + exception.message);
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
                alert(`Cant sell stock "${stock}": ${(await response.json()).error}`);
                return;
            }
            else {
                alert(`Could not sell stock ${stock}: ${response.statusText}`);
                return;
            }
        }

        // Update all dynamic ui immediately to make sure all changes are visible
        uiUpdateDynamic();

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
        alert("Selling the stock failed: " + exception.message);
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
                if (response.status === 422) alert(`Cant send message: ${(await response.json()).error}`);
                else alert(`Could not send message: ${response.statusText} (${response.status})`);
            }

            // Update all dynamic ui immediately to make sure all changes are visible
            uiUpdateDynamic();

        }catch (exception)
        {
            alert("Sending the message failed: " + exception.message);
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
    //throw new ServerException("Unable to get user", packet.message);
    alert("Unable to get user: " + packet.message);
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
    throw new ServerException("Unable to get user", packet.message);
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
    throw new ServerException("Unable to get stocks", packet.message);
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
    throw new ServerException("Unable to get account data", packet.message);
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
    throw new ServerException("Unable to get news data", packet.message);
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
    throw new ServerException("Unable to get Messages", packet.message);
}

// ########### MAIN UI ###############

export async function drawLineGraph()
{
    const canvas = document.getElementById('lineGraph');
    const ctx = canvas.getContext('2d');


    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = [
        'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet',
        'pink', 'cyan', 'magenta', 'lime', 'teal', 'brown', 'gray'
    ];

    const data = []
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

// Shows all stocks owned by the user
export async function buildAccountList()
{
    try
    {
        let stocks = await getUserStocks();
        stocks.sort((a, b) => b.owning - a.owning);

        // Remove all stocks the user doesn't own
        stocks = stocks.filter((stock) => stock.owning > 0);

        Log.log(`User stocks are ${stocks}`);              // @Jenkins line-remove-on-publish


        // Get the user stock list div
        const env = document.getElementById("div-area-userstocks-environment");

        // Check if the account is empty
        if (stocks <= 0)
        {
            env.innerHTML = "You dont have any stocks in your account, yet...";
            return;
        }

        // Remove all existing children
        env.innerHTML = "";                                     // TODO: Find a better way to update the list | low
        stocks.forEach((stock) => {
            env.appendChild(stock.htmlRepresentationUserList);

            stock.sell.addEventListener('click', () => {
                sellStock(stock);
            })

            stock.sellAmount.addEventListener('click', () => {
                const amount = parseInt(prompt("Please enter desired selling amount"));
                if(isNaN(amount)) {alert("Selling amount is invalid"); return;}
                sellStock(stock, amount);
            })

            stock.sellAll.addEventListener('click', () => {
                sellStock(stock, stock.owning);
            })
        })

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load stock market list form server: " + exception.userMessage);
        }
    }
}

// Shows all stocks in ón market and allows to buy them
export async function buildFullMarketList()
{
    try
    {
        const stocks = await getAllStocks();
        stocks.sort((a, b) => b.price - a.price);
        Log.log(`Stockmarket is ${stocks}`);              // @Jenkins line-remove-on-publish

        // Get the stockmarket div
        const env = document.getElementById("div-area-stockmarket-environment");
        // Remove all existing children
        env.innerHTML = "";                                     // TODO: Find a better way to update the list | low
        stocks.forEach((stock) => {
            env.appendChild(stock.htmlRepresentation);
            if (stock.price > BALANCE)
            {
                stock.buy.classList.add("grey-out");
                stock.buyAmount.classList.add("grey-out")
            }
            else
            {
                stock.buy.addEventListener("click", () => {
                    buyStock(stock);
                })
                stock.buyAmount.addEventListener("click", () => {
                    const amount = parseInt(prompt("Please enter desired purchase amount"));
                    if(isNaN(amount)) {alert("Purchase amount is invalid"); return;}
                    buyStock(stock, amount);
                })
            }
        })

        const timestamp = Date.now();
        // Store values in global trends
        stocks.forEach((stock) => {
            if(GLOBAL_STOCK_TRENDS.has(stock.name))
            {
                GLOBAL_STOCK_TRENDS.get(stock.name).push({x:timestamp, y:stock.price});
                // Make sure the list does not get to long
                GLOBAL_STOCK_TRENDS.set(stock.name, GLOBAL_STOCK_TRENDS.get(stock.name).slice(-100));
            }
            else GLOBAL_STOCK_TRENDS.set(stock.name, [{x:timestamp, y:stock.price}]);
        })

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load stock market list form server: " + exception.userMessage);
        }
    }
}

// Create the current leaderboard
export async function buildLeaderboard()
{
    try
    {
        const users = await getAllUsers();
        users.sort((a, b) => b.balance - a.balance);
        Log.log(`Leaderboard is ${users.length}`);              // @Jenkins line-remove-on-publish

        // Get the leaderboard div
        const env = document.getElementById("div-area-leaderboard-environment");
        // Remove all existing children
        env.innerHTML = "";                                     // TODO: Find a better way to update the list | low
        users.forEach((user) => env.appendChild(user.htmlRepresentation));

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load leaderboard form server: " + exception.userMessage);
        }
    }
}

// Create the news feed
export async function buildNews()
{
    try
    {
        const news = await getNews(20);
        news.sort((a, b) => b.timestamp - a.timestamp);
        Log.log(`News is ${news}`);              // @Jenkins line-remove-on-publish

        // Get the leaderboard div
        const env = document.getElementById("div-area-news-environment");
        // Remove all existing children
        env.innerHTML = "";                                     // TODO: Find a better way to update the list | low
        news.forEach((message) => env.appendChild(message.htmlRepresentation));

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load leaderboard form server: " + exception.userMessage);
        }
    }
}

// Create the message feed
export async function buildMessages()
{
    try
    {
        const messages = await getMessages(20);
        messages.sort((a, b) => b.date - a.date);
        Log.log(`Messages are ${messages}`);              // @Jenkins line-remove-on-publish

        // Get the messenger div
        const env = document.getElementById("div-area-messages-environment");
        // Remove all existing children
        env.innerHTML = "";                                     // TODO: Find a better way to update the list | low
        messages.forEach((message) => {
            const html = message.htmlRepresentation;
            if (message.sender === USERNAME)
            {
                html.classList.add("message-outgoing")
            }else
            {
                html.classList.add("message-incoming")
            }
            env.appendChild(html);
        })

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load leaderboard form server: " + exception.userMessage);
        }
    }
}


// Update the static fields in the main ui
// static == fields that are not expected to change at a regular interval
export async function uiUpdateStatic()
{
    // Update the username
    try
    {
        const user = await getUser();

        document.getElementById("test-plain-user-name").innerText = user.name;
        USERNAME = user.name;

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load username form server: " + exception.userMessage);
        }
    }

}

// Update the dynamic fields in the main ui
// dynamic == fields that are expected to change at a regular interval
export async function uiUpdateDynamic()
{
    // Update the balance
    try
    {
        const user = await getUser();

        document.getElementById("test-plain-balance").innerText = user.balance;
        BALANCE = user.balance;
        USERNAME = user.name;
        if (BALANCE_START === null) BALANCE_START = user.balance;

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load balance form server: " + exception.userMessage);
        }
    }

    // Update the return field
    const r = BALANCE - BALANCE_START;
    document.getElementById("test-plain-return").innerText = r;

    // Update the leaderboard
    buildLeaderboard();

    // Update the market
    buildFullMarketList();

    // Update user account data
    buildAccountList();

    // Update the news feed
    buildNews();

    // Update the user messages
    buildMessages();

    // Redraw the line graph
    drawLineGraph();

}

export async function initButtons()
{
    document.getElementById("button-message-send").addEventListener("click", () => {
        sendMessage();
    })
}

export async function init()
{
    // Init all buttons
    initButtons();

    // Update all static fields on login
    uiUpdateStatic();

    // Start regular update of dynamic ui elements
    // Update rate can ba changed via global definitions
    const intervalUpdater = () =>
    {
        Log.log("### Running main ui interval update")                  // @Jenkins line-remove-on-publish
        uiUpdateDynamic();
        setTimeout(intervalUpdater, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
    }
    intervalUpdater();
}