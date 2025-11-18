"use strict";

import {
    alertCustom,
    DYNAMIC_UI_UPDATE_INTERVAL_IN_MS,
    getAllUsers,
    getMessages, hash,
    initNavigationBar, sendMessage,
    updateNavigationBar,
    USERNAME
} from "./lib.js";

// Flag to prevent concurrent updates
let isUpdatingMessages = false;

// Update the displayed messages
async function updateMessageDisplay()
{
    // Prevent concurrent updates
    if (isUpdatingMessages) {
        return;
    }
    isUpdatingMessages = true;
    
    try {
        // Get the last 20? available messages
        const messages = await getMessages(20);

        // Get the environment
        const env = document.getElementById("messages__div-area-list__container");

        if(messages.length <= 0)
        {
            env.innerHTML = "Noch keine Nachrichten vorhanden.";
            return;
        }

        // Update the list
        // Grep the row template
        const template = document.getElementById("messages__div-area-list__container__row-template");

        // Create a fragment for the new list
        const frag = document.createDocumentFragment();

        messages.forEach((message) =>
        {
            // Instance a new row template
            const clone = template.content.cloneNode(true);

            // Format date nicely
            const messageDate = new Date(parseInt(message.date));
            const now = new Date();
            const isToday = messageDate.toDateString() === now.toDateString();
            let dateString;
            if (isToday) {
                dateString = messageDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            } else {
                const dateOptions = { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                };
                if (messageDate.getFullYear() !== now.getFullYear()) {
                    dateOptions.year = 'numeric';
                }
                dateString = messageDate.toLocaleString('de-DE', dateOptions);
            }
            
            clone.querySelector(".messages__div-area-list__container__row-template__display-date").textContent = dateString;
            
            // Format sender -> recipient(s)
            const recipientText = message.recipient || "Alle";
            const senderRecipientText = `${message.sender} → ${recipientText}`;
            clone.querySelector(".messages__div-area-list__container__row-template__display-sender").textContent = senderRecipientText;
            clone.querySelector(".messages__div-area-list__container__row-template__display-text").textContent = message.text;

            // Get the toplevel element of the clone, because querySelector doesn't work for that
            const userElement = Array.from(clone.childNodes)
                .find(node => node.nodeType === Node.ELEMENT_NODE &&
                    node.classList.contains("messages__div-area-list__container__row-template"));

            // Assign a class based on message origin
            if (message.sender === USERNAME)
            {
                userElement.classList.add("messages__div-area-list__container__row-template__style-send-self");
            }else
            {
                userElement.classList.add("messages__div-area-list__container__row-template__style-send-foreign");
            }

            frag.appendChild(clone);
        })

        // Clear the old list and append the new fragment
        env.innerHTML = "";
        env.appendChild(frag);
    } finally {
        isUpdatingMessages = false;
    }
}

let USERS = [];

// Update the list of users in the game
async function updateUsers()
{
    USERS = await getAllUsers();
}

// Calculate a hash over the available stock names
async function hashUsers()
{
    const temp = [];
    USERS.forEach(stock => {
        temp.push(stock.name);
    })
    return await hash(temp);
}

// List of all the usernames to send the message to (selected in UI)
let RECIPIENTS = []

// Select or deselect a user from the recipient list
// Returns true if the user was added, false if the user was removed
async function selectOrDeselectUser(user)
{
    if (RECIPIENTS.includes(user))
    {
        RECIPIENTS = RECIPIENTS.filter( x => x !== user);
        return false;
    }
    else
    {
        RECIPIENTS.push(user);
        return true;
    }
}

async function updateListOfRecipients()
{
    const old_hash = await hashUsers();
    await updateUsers();
    // Only update the list if the list of users has changed
    const new_hash = await hashUsers();
    if (old_hash === new_hash) return;

    // Get the environment
    const env = document.getElementById("messages__div-recipient-list");

    // Update the list
    // Grep the row template
    const template = document.getElementById("messages__div-recipient-list__clickable-element__select-deselect-user__template");

    // Create a fragment for the new list
    const frag = document.createDocumentFragment();

    USERS.forEach((user) =>
    {
        // Instance a new row template
        const clone = template.content.cloneNode(true);

        const labelElement = clone.querySelector(".messages__recipient-checkbox-label");
        const checkbox = clone.querySelector(".messages__recipient-checkbox");
        const textSpan = clone.querySelector(".messages__recipient-checkbox-text");

        textSpan.textContent = user.name;

        // Set checkbox state based on whether user is in RECIPIENTS
        if (RECIPIENTS.includes(user))
        {
            checkbox.checked = true;
        }
        else
        {
            checkbox.checked = false;
        }

        // Add change event listener to checkbox
        checkbox.addEventListener("change", async event => {
            const op = await selectOrDeselectUser(user);
            checkbox.checked = op;
        })

        frag.appendChild(clone);
    })

    // Replace the old list with the new one
    env.innerHTML = "";
    env.appendChild(frag);
}

async function send()
{
    // Get the message text
    const text = document.getElementById("messages__input-message-text").value;
    if (text === "")
    {
        alertCustom("Bitte geben sie eine Nachricht ein.");
        return;
    }

    if (RECIPIENTS.length <= 0)
    {
        alertCustom("Bitte wählen sie mindestens einen Empfänger aus.");
        return;
    }

    // Get all recipients
    let s = "";
    RECIPIENTS.forEach((user) => {
        s += user.name + ",";
    })

    await sendMessage(s, text);

    // Update ui immediately after
    contentLoop()

    document.getElementById("messages__input-message-text").value = "";
}

let contentLoopInterval = null;

async function init ()
{
    initNavigationBar();
    initClickable();
    // Initial load
    await contentLoop();
    startContentLoop();
}

async function contentLoop()
{
    updateNavigationBar();
    await updateMessageDisplay();
    updateListOfRecipients();
}

async function startContentLoop()
{
    // Prevent multiple intervals
    if (contentLoopInterval !== null) {
        clearInterval(contentLoopInterval);
    }
    contentLoopInterval = setInterval(contentLoop, DYNAMIC_UI_UPDATE_INTERVAL_IN_MS);
}

async function initClickable()
{
    document.getElementById("messages__button-send").addEventListener("click", async event => {
        send();
    })
}

window.addEventListener("load", init );