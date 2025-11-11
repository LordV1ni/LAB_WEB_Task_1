class AccountPosition {

    constructor(stock) {
        this.stock = stock;
        this.number = 0;
    }

    value () {
        return this.stock.price * this.number;
    }
}
module.exports=AccountPosition;