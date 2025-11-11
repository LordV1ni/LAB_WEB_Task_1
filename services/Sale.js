"use strict";

class Sale {

    constructor(stock,number){
        if (this.timestamp === null) {
            this.timestamp = new Date().getTime();
        }
        this.stock = JSON.parse(JSON.stringify(stock));
        this.number = number;
    }
}
module.exports=Sale;