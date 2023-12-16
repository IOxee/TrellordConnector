const express = require('express');
const fetch = require('node-fetch');
const app = express();
let serverStart;
let disableComments = false;

require('dotenv').config();
const trelloApiKey = process.env.TRELLO_API_KEY;
const trelloToken = process.env.TRELLO_TOKEN;
const discordWebhookUrl = 'YOUR DISCORD WEBHOOK URL';
const boardId = 'YOUR BOARD ID';

let lastActionId = '';
let messagesSended = [];
let messagesQueue = [];
const TIMER_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

setInterval(checkForTrelloUpdates, CHECK_INTERVAL);
function initializeMessageTimer() {
    setInterval(sendMessagesToDiscord, TIMER_DURATION);
}

function debugComment(message) {
    if (disableComments) return;
    debugComment(message);
}

async function checkForTrelloUpdates() {
    let lastCheck = new Date();
    try {
        const response = await fetch(`https://api.trello.com/1/boards/${boardId}/actions?key=${trelloApiKey}&token=${trelloToken}`);
        const actions = await response.json();

        let newActions = actions.filter(action => {
            const actionDate = new Date(action.date);
            const isNewAction = actionDate > serverStart;
            const isNotQueued = !messagesQueue.some(message => message.key === action.id);
            const isNotSent = !messagesSended.includes(action.id);
        
            return isNewAction && isNotQueued && isNotSent;
        });
        debugComment('Consulting Trello API... | Hour: ' + lastCheck.toLocaleTimeString() + ' | New changes: ' + newActions.length);
        if (newActions.length > 0) {
            newActions.forEach(action => {
                debugComment(`A new action has been found: ${action.type}`);
                createMessage(action);
            });
        }
    } catch (error) {
        console.error('Error consulting the Trello API:', error);
    }
}


async function sendMessagesToDiscord() {
    debugComment('Sending messages to discord...');
    while (messagesQueue.length > 0) {
        let message = messagesQueue.shift();
        messagesSended.push(message.key);
        try {
            await fetch(discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message.value)
            });
        } catch (error) {
            console.error('Error sending a message to discord:', error);
        }
    }
    timer = null;
}

async function createMessage(action) {
    let messageTitle = '';
    let messageDescription = '';
    let messageUrl = '';
    let messageFields = [];

    switch (action.type) {
        case 'createCard':
            messageTitle = `Created card: "${action.data.card.name}"`;
            messageDescription = `A new card has been created.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;

            if (action.data.card.hasOwnProperty('desc')) {
                messageFields.push({ name: 'Description', value: action.data.card.desc.substring(0, 100) + '...' });
            }

            if (action.data.card.hasOwnProperty('due')) {
                messageFields.push({ name: 'Due date', value: action.data.card.due });
            }

            if (action.data.card.hasOwnProperty('dueComplete')) {
                messageFields.push({ name: 'Expiration status', value: action.data.card.dueComplete ? 'Completed' : 'Waiting' });
            }

            if (action.data.card.hasOwnProperty('idAttachmentCover')) {
                messageFields.push({ name: 'Front page', value: action.data.card.idAttachmentCover });
            }

            if (action.data.card.hasOwnProperty('idChecklists')) {
                messageFields.push({ name: 'Checklist', value: action.data.card.checklists[0].name });
            }

            if (action.data.card.hasOwnProperty('idMembers')) {
                messageFields.push({ name: 'Member', value: action.memberCreator.fullName });
            }

            if (action.data.card.hasOwnProperty('idLabels')) {
                messageFields.push({ name: 'Label', value: action.data.card.labels[0].name });
            }

            if (action.data.card.hasOwnProperty('idList')) {
                messageFields.push({ name: 'List', value: action.data.list.name });
            }
            break;
        case 'updateCard':
            messageTitle = `Updated card: "${action.data.card.name}"`;
            messageDescription = `A card has been updated.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            if (action.data.old.hasOwnProperty('idList')) {
                messageFields.push({ name: 'Previous list', value: action.data.listBefore.name });
                messageFields.push({ name: 'Current list', value: action.data.listAfter.name });
            }
            if (action.data.old.hasOwnProperty('name')) {
                messageFields.push({ name: 'Previous name', value: action.data.old.name });
                messageFields.push({ name: 'Current name', value: action.data.card.name });
            }
            if (action.data.old.hasOwnProperty('idMembers')) {
                messageFields.push({ name: 'Added member', value: action.memberCreator.fullName });
            }
            if (action.data.old.hasOwnProperty('desc')) {
                messageFields.push({ name: 'Previous description', value: action.data.old.desc.substring(0, 100) + '...'  });
                messageFields.push({ name: 'Current description', value: action.data.card.desc.substring(0, 100) + '...'  });
            }
            if (action.data.old.hasOwnProperty('due')) {
                messageFields.push({ name: 'Previous expiration date', value: action.data.old.due });
                messageFields.push({ name: 'Current expiration date', value: action.data.card.due });
            }
            if (action.data.old.hasOwnProperty('dueComplete')) {
                messageFields.push({ name: 'Previous expiration status', value: action.data.old.dueComplete ? 'Completed' : 'Waiting' });
                messageFields.push({ name: 'Current expiration status', value: action.data.card.dueComplete ? 'Completed' : 'Waiting' });
            }
            if (action.data.old.hasOwnProperty('idAttachmentCover')) {
                messageFields.push({ name: 'Previous cover', value: action.data.old.idAttachmentCover });
                messageFields.push({ name: 'Current cover', value: action.data.card.idAttachmentCover });
            }
            if (action.data.old.hasOwnProperty('idChecklists')) {
                messageFields.push({ name: 'Checklist added', value: action.data.card.checklists[0].name });
            }

            break;
        case 'deleteCard':
            messageTitle = `Deleted card`;
            messageDescription = `A card has been deleted.`;
            break;
        case 'addMemberToCard':
            messageTitle = `Member added to card: "${action.data.card.name}"`;
            messageDescription = `A member has been added to the card.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            break;
        case 'removeMemberFromCard':
            messageTitle = `Card deleted member: "${action.data.card.name}"`;
            messageDescription = `A card member has been deleted.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            break;
        case 'moveCardToBoard':
            messageTitle = `Board moving card: "${action.data.card.name}"`;
            messageDescription = `A card to another board has moved.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            break;
        case 'updateList':
            messageTitle = `List Moved Card: "${action.data.listAfter.name}"`;
            messageDescription = `A card to another list has moved.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            break;
        case 'addChecklistToCard':
            messageTitle = `Checklist added to card: "${action.data.card.name}"`;
            messageDescription = `A checklist has been added to the card.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            break;
        case 'removeChecklistFromCard':
            messageTitle = `Checklist deleted card: "${action.data.card.name}"`;
            messageDescription = `A card checklist has been eliminated.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            break;
        case 'updateCheckItemStateOnCard':
            messageTitle = `Updated Checklist: "${action.data.checkItem.name}"`;
            messageDescription = `A checklist has been updated.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            if (action.data.checkItem.hasOwnProperty('state')) {
                if (action.data.checkItem.state == 'complete') {
                    messageFields.push({ name: 'Name', value: ':white_check_mark: ' + action.data.checkItem.name });
                } else {
                    messageFields.push({ name: 'Name', value: ':x: ' + action.data.checkItem.name });
                }
            }           
        
            break;
        case 'updateChecklist':
            messageTitle = `Updated Checklist: "${action.data.checklist.name}"`;
            messageDescription = `A checklist has been updated.`;
            messageUrl = `https://trello.com/c/${action.data.card.shortLink}`;
            if (action.data.checklist.hasOwnProperty('name')) {
                messageFields.push({ name: 'Previous name', value: action.data.old.name });
                messageFields.push({ name: 'Current name', value: action.data.checklist.name });
            }
            break;
        default:
            messageTitle = 'Trello action';
            messageDescription = `An unknown action has been performed: ${action.type}`;
            break;
    }

    let message = {
        content: messagesQueue.length > 0 ? '' : 'YOUR MENTION ROLE OR ROLES <@&000000000000000000>',
        embeds: [{
            title: messageTitle,
            description: messageDescription,
            fields: messageFields,
            timestamp: action.date,
            footer: { text: 'TrellordConnector' },
        }]
    };
    
    messagesQueue.push({
        key: action.id,
        value: message
    });
}



app.listen(port || 8080, () => {
    serverStart = new Date();
    initializeMessageTimer();
    console.log(`Server started at ` + new Date().toLocaleTimeString());
});
