"use strict";

class Finder{

    constructor( users, allStocks ){
        this.users = users;
        this.allStocks = allStocks;
    }

    /** finders */
    findUserByName(aName) {
        const user = this.users.find(user => user.name === aName);
        if (!user) {
            throw new Error(`user "${aName}" not found`);
        }
        return user;
    }

    findStockByName(aStock) {
        const stock = this.allStocks.find(stock => stock.name === aStock);
        if (!stock) {
            throw new Error(`stock "${aStock}" not found`);
        }
        return stock;
    }

}
module.exports=Finder;