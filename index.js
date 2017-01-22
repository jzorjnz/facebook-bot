'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const keys = require('./config/keys.json');

/**
 *  Define the sample application.
 */
var FacebookBotApp = function() {

    //  Scope.
    var self = this;

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */
    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.port      =  (process.env.PORT || 5000);

        /*
        self.ipaddress = "127.0.0.1";
        self.port      = 8080;

        if(!server.local){
          self.ipaddress = keys.server.ip;
          self.port = keys.server.port;
          console.log('Running server using ip: ' + self.ipaddress + ' port: ' + self.port);
        }
        else {
            console.log('Running server using local');
        };
        */
        
        //console.log('Running server using ip: ' + self.ipaddress + ' port: ' + self.port);
        //self.app.set('port', (process.env.PORT || 5000));

    };

    
    /**
     *  Populate the cache.
     */
    /*
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };
    */

    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    //self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        require('./app/routes/index')(self.app);
        require('./app/routes/webhook')(self.app);
    }

    self.initializeApp = function() {
        self.app = express();
        
        // allow CORS
        /*
        self.app.all('*', function(req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Credentials", "true");
          res.header("Access-Control-Allow-Methods", "GET,HEAD,DELETE,OPTIONS,POST,PUT");
          res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, Authorization, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
          if (req.method == 'OPTIONS') {
            res.status(200).end();
          } else {
            next();
          }
        });
        */
        /*
        self.app.use(function(req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Credentials", "true");
          res.header("Access-Control-Allow-Methods", "GET,HEAD,DELETE,OPTIONS,POST,PUT");
          res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, Authorization, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
          next();
        });
        */
        // Process application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({extended: false}));

        // Process application/json
        app.use(bodyParser.json());

        
        
    }

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        console.log('creating routes...');
    };

    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        
        self.setupTerminationHandlers();
        
        self.initializeApp();
        
        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        app.listen(self.port, function() {
            console.log('running on port', self.port);
        });
    };

};   /*  Sample Application.  */

/**
 *  main():  Main code.
 */
var facebookBotApp = new FacebookBotApp();
facebookBotApp.initialize();
facebookBotApp.start();