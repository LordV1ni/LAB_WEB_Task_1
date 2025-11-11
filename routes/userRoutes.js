const stockMarket = require('../services/StockMarket');
const finder=stockMarket.finder;

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user name and balance
 *     description: Retrieves user name and balance based on the authenticated username
 *     tags:
 *       - Users
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Username
 *                 balance:
 *                   type: number
 *                   description: User's abalance
 *       500:
 *         description: Internal Server Error - User data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user data somehow not found
 */
router.get('/', function(req, res) {
    try{
        res.send(finder.findUserByName(req.user));
    }
    catch (error){
        res.status(500).json({message: error.message});
    }
});

/**
 * @swagger
 * /api/user/everybody:
 *   get:
 *     summary: Get portfolio information for all users
 *     description: Retrieves the sum of balance and depot value for all users
 *     tags:
 *       - Users
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: List of user portfolio data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: User name
 *                   sum:
 *                     type: number
 *                     description: Total balance plus depot value
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
router.get('/everybody', function(req, res) {
    const userPortfolioData = stockMarket.users.map(user => ({
        name: user.name,
        sum: user.balance + user.account.totalValue()
    }));
    res.send(userPortfolioData);
})

module.exports = router;