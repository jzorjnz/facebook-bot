const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cache = require('../cache/cache'); // get the mongoose model
const app = express();

module.exports = function(app){

  console.log('adding index API');
  app.get('/asciimo', function(req, res) {
    var link = "http://i.imgur.com/kmbjB.png";
    res.send("<html><body><img src='" + link + "'></body></html>");
  });
  app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send(cache.cache_get('index.html') );
  });
  
}