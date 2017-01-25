const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const keys = require('../../config/keys.json');
const chat = require('../../files/chat');
handleError = function(err) {
  console.log ("Got an error", err);
}

const weatherQueryStart = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22';
const weatherQueryEnd = '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

callSendAPI = function(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: keys.access_token },
    method: 'POST',
    json: messageData
}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      //console.error(response);
      console.error(error);
    }
  });  
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
    callSendAPI(messageData);
    /*
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
    */
}

receivedMessage = function (event) {
    console.log('incoming event', event);
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    console.log(JSON.stringify(message));
    var messageId = message.mid;
    var messageText = message.text;
    var messageAttachments = message.attachments;
    if (messageText) {
        sendTextMessage(senderID, messageText);
    }
}

getWeather = function (callback, location) {
  var weatherEndpoint = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22' + location + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
  var currentWeatherEndPoint = 'https://api.apixu.com/v1/current.json?key=96d9ed80ad7f44b386a152505172201&q=' + location;

  console.log(currentWeatherEndPoint);
  request({
    url: currentWeatherEndPoint,
    json: true
  }, function(error, response, body) {
    try {
        if(body.current && body.location){
            //var condition = body.query.results.channel.item.condition;
            //var result = body.current;
            callback({ 
                text: "Today is " + body.current.temp_c + " and " + body.current.condition.text + " in " + body.location.name
                });
        }
        else{
            console.error('There was an error calling yahoo Weather API');
            callback("There was an error calling yahoo Weather API");
        }
    } catch(err) {
      console.error('error caught', err);
      callback("There was an error");
    }
  });
}

sendTextMessage = function (recipientId, messageText) {
    console.log('incoming message text', messageText);
    getWeather(function(message) {
        var messageData = {
            recipient: {
            id: recipientId
            },
            message: {
            text: message
            }
        };
        callSendAPI(messageData);
    }, messageText);
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
        
        var data = req.body;
        // Make sure this is a page subscription
        if (data.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
            data.entry.forEach(function(entry) {
                var pageID = entry.id;
                var timeOfEvent = entry.time;
            // Iterate over each messaging event
                entry.messaging.forEach(function(event) {
                    if (event.message) {
                        receivedMessage(event);
                    } else {
                        console.log("Webhook received unknown event: ", event);
                    }
                });
            });
        // Assume all went well.
            //
            // You must send back a 200, within 20 seconds, to let us know
            // you've successfully received the callback. Otherwise, the request
            // will time out and we will keep trying to resend.
            res.sendStatus(200);
        }
        else{
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
                    let text = JSON.stringify(event.postback)
                    sendMessage(sender, text);
                    console.log('postback received: ' + text);
                    //let text = JSON.stringify(event.postback)
                    //sendTextMessage(sender, "Postback received: " + text.substring(0, 200), keys.fb_token)
                    continue
                }
            }
            res.sendStatus(200);
        }
    });
}