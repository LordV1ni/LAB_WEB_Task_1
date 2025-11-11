const stockMarket = require('../services/StockMarket');
const finder=stockMarket.finder;

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get user messages
 *     description: Retrieves messages for the authenticated user, optionally filtered by a timestamp. Without parameters you only get the first 20 messages
 *     tags:
 *       - Messages
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: query
 *         name: lastTime
 *         schema:
 *           type: integer
 *         description: Timestamp to filter messages (only messages newer than this timestamp will be returned)
 *         required: false
 *     responses:
 *       200:
 *         description: A list of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sender:
 *                     type: string
 *                     description: Name of the message sender
 *                   recipient:
 *                     type: string
 *                     description: Name of the message recipient
 *                   text:
 *                     type: string
 *                     description: Content of the message
 *                   date:
 *                     type: string
 *                     description: Date when the message was sent
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
    const user = finder.findUserByName(req.user);
    if (req.query.lastTime) {
        // Check if lastTime consists of exactly 13 digits 0-9
        if (!/^\d{13}$/.test(req.query.lastTime)) {
            return res.status(422).send({ error: 'Invalid lastTime parameter. Must be exactly 13 digits.' });
        }

        const lastTime= req.query.lastTime;
        const messages = user.messages.filter(message =>
            message.date > lastTime
        );

        res.send( messages );
    }
    else {
        res.send( user.messages.slice( 0, 20)  );
    }
});

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     description: Allows users to send messages to other users or broadcast to all users
 *     tags:
 *       - Messages
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: Name of the recipient user
 *               message:
 *                 type: string
 *                 description: Content of the message to send
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sender:
 *                   type: string
 *                   description: Name of the message sender
 *                 recipient:
 *                   type: string
 *                   description: Name of the message recipient
 *                 text:
 *                   type: string
 *                   description: Content of the message
 *                 date:
 *                   type: string
 *                   description: Date when the message was sent
 *       422:
 *         description: Unprocessable Entity - Invalid input
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
router.post('/', function (req, res) {
    let message;
    try {
        let sender = finder.findUserByName( req.user );

        // Check if recipient consists only of A-Za-z0-9äöüÄÖÜ
        if (!/^[A-Za-z0-9äöüÄÖÜ]+$/.test(req.body.recipient)) {
           throw new Error('Invalid recipient format. Only alphanumeric characters and umlauts are allowed.');
        }
        const recipient = finder.findUserByName( req.body.recipient );

        const messageText = req.body.message;

        message = recipient.tell( sender, messageText );
        sender.messages.push( message );
    }
    catch(err) {
        res.status(422).json({"error":err.message});
        return;
    }
    res.send( message );
})
module.exports = router;