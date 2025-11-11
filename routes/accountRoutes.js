const stockMarket = require('../services/StockMarket');
const finder=stockMarket.finder;

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/account:
 *   get:
 *     summary: Get user account information
 *     description: Retrieves the authenticated user's depot positions and total depot value
 *     tags:
 *       - Account
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Account information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 positions:
 *                   type: array
 *                   description: List of account positions
 *                   items:
 *                     type: object
 *                     properties:
 *                       stock:
 *                         type: object
 *                         description: Stock information
 *                       number:
 *                         type: number
 *                         description: Number of shares held
 *                 value:
 *                   type: number
 *                   description: Total value of all positions in the depot
 *                   example: 15420.50
 *       500:
 *         description: Internal Server Error - User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user "username" not found
 */
router.get('/', function(req, res) {
    try{
        let user = finder.findUserByName(req.user);
        res.send({"positions": user.account.accountPositions, "value": user.account.totalValue()});
    }
    catch (error){
        res.status(500).json({message: error.message});
    }
});

/**
 * @swagger
 * /api/account/positions:
 *   post:
 *     summary: Buy or sell stocks
 *     description: Allows users to buy or sell stocks in their depot
 *     tags:
 *       - Account
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *               - number
 *             properties:
 *               stock:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Name of the stock to buy/sell
 *               number:
 *                 type: number
 *                 description: Number of shares to buy (positive) or sell (negative)
 *     responses:
 *       201:
 *         description: Transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                   description: Transaction confirmation message
 *                 sales:
 *                   type: object
 *                   description: Sale information
 *       422:
 *         description: Unprocessable Entity - Invalid input or insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/positions', function (req, res){
    let user;
    let stock;
    let number;
    try {
        user = finder.findUserByName(req.user);
        stock = finder.findStockByName(req.body.stock.name);
        number = parseInt(req.body.number);
        if (number === null || isNaN(number)) {
            throw "ungueltige anzahl";
        }
        user.buy(stock, number);
    }
    catch (err) {
        //console.log(JSON.stringify(err));
        res.status(422).send({"error": err});
        return;
    }

    let newsText;
    if (number > 0) {
        newsText = "KAUF: " + user.name + ": " + number + " " + stock.name;
    }
    else {
        newsText = "VERKAUF: " + user.name + ": " + (-1 * number) + " " + stock.name;
    }

    const date = new Date();
    stockMarket.news[stockMarket.news.length] = {
        "timestamp": date.getTime(),
        "time": date.getHours() + ":" + date.getMinutes(),
        "text": newsText
    };

    const sales = stockMarket.createSale(stock,number);
    user.sales.push(sales);
    res.status(201).send({"success": newsText, "sales": sales});
})

module.exports = router;