const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const keys = require('../../config/keys.json');
const chat = require('../../files/chat');
handleError = function(err) {
  console.log ("Got an error", err);
}

sendGenericMessage = function (sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble"
                    }]
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble"
                    }]
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:keys.fb_token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

sendTextMessage = function (sender, text) {
    let messageData = { text:text };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:keys.fb_token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('sendTextMessage | Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('sendTextMessage | Error: ', response.body.error);
        }
    });
}

sendMessage = function (sender, text) {
    let messageData = { text: 'Hi'};
    chat.chat.forEach(function(element) {
        element.keywords.forEach(function(keyword) {
            if(text.toLowerCase().includes(keyword.toLowerCase())){
                messageData = element.response;        
            }
        }, this);
    }, this);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:keys.fb_token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('sendTextMessage | Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('sendTextMessage | Error: ', response.body.error);
        }
    });
}
module.exports = function(app){

  // for Facebook verification
    console.log('adding webhook API');
    app.get('/webhook/', function (req, res) {
        if (req.query['hub.verify_token'] === keys.verify_token) {
            res.send(req.query['hub.challenge']);
        }
        res.send('Error, wrong token');
    });

    app.post('/webhook/', function (req, res) {
        let messaging_events = req.body.entry[0].messaging
        for (let i = 0; i < messaging_events.length; i++) {
            let event = req.body.entry[0].messaging[i]
            let sender = event.sender.id
            if (event.message && event.message.text) {
                let text = event.message.text
                sendMessage(sender, text);
                /*
                if (text === 'Generic') {
                    sendGenericMessage(sender)
                    continue
                }
                else{
                    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
                }
                */
            }
            if (event.postback) {
                let text = event.message.text
                sendMessage(sender, text);
                console.log('postback received: ' + event.message.text);
                //let text = JSON.stringify(event.postback)
                //sendTextMessage(sender, "Postback received: " + text.substring(0, 200), keys.fb_token)
                continue
            }
        }
        res.sendStatus(200);
    });
}