"use strict";

class Message{
    constructor(sender, recipient, messageText) {
        this.validateMessage(messageText);

        this.date = new Date().getTime();
        this.sender = sender;
        this.recipient = recipient;
        this.text = messageText;
    }

    validateMessage(messageText) {
        // Validate messageText
        if (typeof messageText !== 'string') {
            throw new Error('Message text must be a string');
        }
        if (messageText.length > 200) {
            throw new Error('Message text exceeds maximum length of 200 characters');
        }
        // Check for allowed characters using regex
        // The \s in the regex allows spaces and other whitespace characters
        const allowedChars = /^[A-Za-zäöüÄÖÜß0-9,.;:#+\-()%$€\s]*$/;
        if (!allowedChars.test(messageText)) {
            throw new Error('Message text contains invalid characters');
        }
    }
}

module.exports=Message;