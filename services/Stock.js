"use strict";

class Stock{
    constructor(name) {
        this.name = name;
        this.price = 500;
        this.numberAvailable = 100000;

        //diese Parameter sind für internen Nutzen
        this.coreValue = Math.random() * 200 + 200;
        this.amplitude = Math.random() * 80 + 20;
        this.phaselength = Math.random() * 50 + 30;
        this.phase = Math.random() * 100;
    }

    /**
     * @param buy positiv: entnehme aktien, negativ: lege Aktien zurück
     */
    buy(buy) {
        if (buy > 0 && this.numberAvailable < buy) {
            throw "Nicht genügend Aktien im Markt verfügbar.";
        }
        this.numberAvailable -= buy;
    };

    toJSON() {
        return {
            "name": this.name,
            "price": this.price,
            "numberAvailable": this.numberAvailable
        };
    }

}

module.exports = Stock;