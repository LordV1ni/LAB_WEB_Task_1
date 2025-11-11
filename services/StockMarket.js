"use strict";

const User=require("./User");
const Stock=require("./Stock");
const Sale=require("./Sale");
const Finder=require("./Finder");

class StockMarket{
    constructor() {
        this.allStocks =
            [   new Stock("adidas"),
                new Stock("Allianz"),
                new Stock("BASF"),
                new Stock("Bayer"),
                new Stock("Beiersdorf"),
                new Stock("BMW"),
                new Stock("Continental"),
                new Stock("Covestro"),
                new Stock("Daimler"),
                new Stock("Delivery Hero"),
                new Stock("Deutsche Bank"),
                new Stock("Deutsche Börse"),
                new Stock("Deutsche Post"),
                new Stock("Deutsche Telekom"),
                new Stock("Deutsche Wohnen"),
            ];
        this.users =  [
            new User("max", "max", this.allStocks),
            new User("moritz", "moritz", this.allStocks),
            new User("lempel", "lempel", this.allStocks),
            new User("bolte", "bolte", this.allStocks),
        ];
        this.finder=new Finder(this.users,this.allStocks);
        this.news = [];
        this.steps = 0;
        setInterval(this.updateStockPrices.bind(this), 500);
    };

    updateStockPrices() {
        // Zähler für Kursveränderungen
        this.steps++;
        for (let i = 0; i < this.allStocks.length; i++) {

            // Zufällige Veränderung der Parameter einer Sinus-Schwingung
            if (Math.random() < 0.01) {
                this.allStocks[i].coreValue += 20 - Math.random() * 40;
                if (this.allStocks[i].coreValue < 10) {
                    this.allStocks[i].coreValue = 10;
                }
            }
            if (Math.random() < 0.08) {
                this.allStocks[i].amplitude += 15 - Math.random() * 30;
                if (this.allStocks[i].amplitude < 1) {
                    this.allStocks[i].amplitude = 1;
                }
            }
            if (Math.random() < 0.01) {
                this.allStocks[i].phase += 10 - Math.random() * 20;
            }
            if (Math.random() < 0.10) {
                this.allStocks[i].phaselength += 30 - Math.random() * 60;
                if (this.allStocks[i].phaselength < 50) {
                    this.allStocks[i].phaselength = 50;
                }
            }

            // Rauschen berechnen
            let noise = 4 - Math.random() * 2;
            // Berechnen der Sinus-Schwingung
            this.allStocks[i].price = Math.round(100 * Math.sin((this.steps + this.allStocks[i].phase) / this.allStocks[i].phaselength) * this.allStocks[i].amplitude
                + this.allStocks[i].coreValue + noise) / 100;
            if (this.allStocks[i].price < 0) {
                this.allStocks[i].price = 1;
            }
        }
    }

    createSale(aktie, anzahl){
        return new Sale(aktie,anzahl);
    }

}

module.exports = new StockMarket();