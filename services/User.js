"use strict";

const Account = require("./Account");
const Message = require("./Message");

const COST_TRANSACTION = 0.05; // 5% buying and selling

class User {
    constructor(name, passwd, allStocks) {
        this.name = name;
        this.passwd = passwd;
        this.balance = 10000;
        this.account = new Account(allStocks);
        this.sales = [];
        this.messages = [];
    }

    buy (stock, number) {
        const cost = stock.price * number;
        const totalCost = cost * (1+COST_TRANSACTION);

        if (totalCost > this.balance) {
            throw "Zu wenig Guthaben für Aktienkauf.";
        }

        const actualCost = this.account.buy(stock, number); // fixit: this might differ from totalCost...
        if (actualCost > 0) {
            this.balance -= (1+COST_TRANSACTION) * actualCost;
        }
        else {
            this.balance -= actualCost * (1-COST_TRANSACTION);
        }
    };

    tell(sender, messageText) {
        const message = new Message(sender.name, this.name, messageText);
        this.messages.push(message);
        return message;
    }

    toJSON () {
        return {
            "name": this.name,
            "balance": this.balance
        };
    };
}

module.exports = User;