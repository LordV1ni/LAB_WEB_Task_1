const stockMarket = require('../services/StockMarket');

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/stocks:
 *   get:
 *     summary: Get all available stocks
 *     description: Retrieves a list of all available stocks in the market
 *     tags:
 *       - Stocks
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: A list of stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Stock name
 *                   price:
 *                     type: number
 *                     description: Current stock price
 *                   numberAvailable:
 *                     type: number
 *                     description: Number of stocks available
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
router.get('/', function(req, res) {
    res.send(stockMarket.allStocks);
});



module.exports = router;