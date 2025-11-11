const stockMarket = require('../services/StockMarket');

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get news messages
 *     description: Retrieves news messages, optionally filtered by a timestamp. Without parameters you only get the first 20 news messages
 *     tags:
 *       - News
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: query
 *         name: lastTime
 *         schema:
 *           type: integer
 *         description: Timestamp to filter news messages (only messages newer than this timestamp will be returned)
 *         required: false
 *     responses:
 *       200:
 *         description: A list of news messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: integer
 *                     description: Unix timestamp of the news message
 *                   time:
 *                     type: string
 *                     description: Formatted time (HH:MM)
 *                   text:
 *                     type: string
 *                     description: Content of the news message
 *       422:
 *         description: Unprocessable Entity - Invalid lastTime parameter
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
router.get('/', function(req, res) {
    if (req.query.lastTime) {
        // Check if lastTime consists of exactly 13 digits 0-9
        if (!/^\d{13}$/.test(req.query.lastTime)) {
            return res.status(422).send({ error: 'Invalid lastTime parameter. Must be exactly 13 digits.' });
        }

        const lastTime = parseInt(req.query.lastTime);
        const news = stockMarket.news.filter(message => message.timestamp > lastTime);
        res.send(news);
    }
    else {
        res.send(stockMarket.news.slice(0, 20));
    }
});

module.exports = router;