// GLOBAL

const SERVER_BASE_URL = "http://localhost:3333";        // Without trailing slash!
const LOGGING = {
    verbose: true,
    warn: true,
    error: true
}
const DYNAMIC_UI_UPDATE_INTERVAL_IN_MS = 5000;

let BALANCE = 0;

// Util

// @Jenkins start-block-remove-on-publish
// Log something to the console
const Log = Object.freeze({
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
async function getRequestToServe(endpoint)
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

class User
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
class ServerPacket
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

// Class representing a single stock
class Stock
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
        element.innerHTML = `${this.name} | ${this.price} | ${this.number} | `;
        element.appendChild(this.buy);
        return element;
    }
    get htmlRepresentationUserList()
    {
        const element = document.createElement("p");
        element.classList.add("userstock-element");
        this.sell = document.createElement("button");
        this.sell.innerText = "Sell";
        element.innerHTML = `${this.name} | ${this.price} | ${this.number} | ${this.owning} | `;
        element.appendChild(this.sell);
        return element;
    }
}

// Error during server communication
class ServerException extends Error
{
    constructor(message, userMessage)
    {
        super(message);
        this.userMessage = userMessage;
        this.name = "ServerError";
    }
}

// Get methods

// Get the current user as a object of type user
async function getUser()
{
    // Get the user data from the server
    const packet = await getRequestToServe("/api/user");
    if(packet.ok)
    {
        const json = await packet.payload.json();
        Log.log(`User data is ${json}`);                  // @Jenkins line-remove-on-publish
        return new User(json.name, json.balance);
    }
    throw new ServerException("Unable to get user", packet.message);
}

// Get all users as a list of user objects
async function getAllUsers()
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
async function getAllStocks()
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
async function getUserStocks()
{
    const packet = await getRequestToServe("/api/account");
    if(packet.ok)
    {
        //Build a list of all available stocks
        const stocks = [];
        const json = (await packet.payload.json()).positions;
        json.forEach(stock => stocks.push(new Stock(stock.stock.name, stock.stock.price, stock.stock.numberAvailable, stock.number)));
        Log.log(`Available stock list is ${stocks}`);                  // @Jenkins line-remove-on-publish
        return stocks;
    }
    Log.log(`Account fetch failed`);                  // @Jenkins line-remove-on-publish
    throw new ServerException("Unable to get account data", packet.message);
}

// ########### MAIN UI ###############

// Shows all stocks owned by the user
async function buildAccountList()
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
async function buildFullMarketList()
{
    try
    {
        const stocks = await getAllStocks();
        stocks.sort((a, b) => a.price - b.price);
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
            }
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
async function buildLeaderboard()
{
    try
    {
        const users = await getAllUsers();
        users.sort((a, b) => a.balance - b.balance);
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

// Update the static fields in the main ui
// static == fields that are not expected to change at a regular interval
async function uiUpdateStatic()
{
    // Update the username
    try
    {
        const user = await getUser();

        document.getElementById("test-plain-user-name").innerText = user.name;

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
async function uiUpdateDynamic()
{
    // Update the balance
    try
    {
        const user = await getUser();

        document.getElementById("test-plain-balance").innerText = user.balance;
        BALANCE = user.balance;

    }catch (exception)
    {
        if (exception instanceof ServerException)
        {
            alert("Failed to load balance form server: " + exception.userMessage);
        }
    }

    // Update the leaderboard
    buildLeaderboard();

    // Update the market
    buildFullMarketList();

    // Update user account data
    buildAccountList()

}

async function init()
{
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

window.addEventListener("load", init);