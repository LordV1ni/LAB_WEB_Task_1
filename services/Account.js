"use strict";

const DepotPosition=require("./AccountPosition");

class Account{

    constructor(totalStock){
        this.accountPositions = new Array(totalStock.length);
        for (let i = 0; i < totalStock.length; i++) {
            this.accountPositions[i] = new DepotPosition(totalStock[i]);
        }
    }

    totalValue() {
        return this.accountPositions.reduce((totalValue, position) => {
            return totalValue + position.value();
            }, 0);
    }


    buy (stock, number) {
        for (let i = 0; i < this.accountPositions.length; i++) {
            if (this.accountPositions[i].stock === stock) {

                if (this.accountPositions[i].number + number < 0) {
                    throw "Zu wenige Aktien für Verkauf im Account.";
                }

                stock.buy(number);

                this.accountPositions[i].number += number;
                return number * stock.price;
            }
        }
    }

}

module.exports=Account;