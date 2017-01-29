const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const keys = require('../../config/keys.json');
const chat = require('../../files/chat');
handleError = function(err) {
  console.log ("Got an error", err);
}

var usersState = {};

const weatherQueryStart = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22';
const weatherQueryEnd = '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

callSendAPI = function(senderID, messageData) {
  request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:keys.fb_token},
        method: 'POST',
        json: {
            recipient: {id:senderID},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
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

/*
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
*/

sendMessage = function (sender, text) {
    let messageData = { text: 'Hi'};
    chat.chat.forEach(function(element) {
        element.keywords.forEach(function(keyword) {
            if(text.toLowerCase().includes(keyword.toLowerCase())){
                messageData = element.response;        
            }
            /*
            if(text.toLowerCase().includes('weather')){
                console.log('setting state to weather...');
                usersState[sender] = 'STATE_WEATHER';
            }
            */
        }, this);
    }, this);
    callSendAPI(sender, messageData);
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

receivedMessage = function (event, res) {
    console.log('incoming event', event);
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var text = '';
    if (event.message && event.message.text) {
        var message = event.message;
        console.log('event.message = ' + JSON.stringify(message));
        var messageId = message.mid;
        text = message.text;
        var messageAttachments = message.attachments;
    }
    else if (event.postback) {
        text = JSON.stringify(event.postback)
        console.log('postback received: ' + text);
    }
    else{
        // it was probably some other info that we have nothing to do at this point
        console.log('returning without doing anything...');
        return;
    }   

    if(usersState[senderID] === 'STATE_WEATHER'){
        usersState[senderID] = null;
        sendTextMessage(senderID, text);
    }
    else{
        console.log(' calling send message with text: ' + text);
        sendMessage(senderID, text);
    }
    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
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
            callback("Today is " + body.current.temp_c + " °C (" + body.current.temp_f + " °F) and condition is " + body.current.condition.text + " in " + body.location.name);
        }
        else{
            console.error('There was an error calling Weather API');
            callback("There was an error getting Weather. Try writing location e.g. Paris");
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
        callSendAPI(recipientId, {
            text: message
            });
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
                    if(event.message){
                        if(event.message.is_echo){
                            console.log('it is a echo!');
                        }
                        else{
                            console.log('got another entry!');
                            receivedMessage(event, res);
                            /*
                            if (event.message) {
                                receivedMessage(event);
                            } else {
                                console.log("Webhook received unknown event: ", event);
                            }
                            */
                        }
                    }
                });
            });
            
            
                
          
        }
        /*
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
                    //* /
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
        */
    });
}