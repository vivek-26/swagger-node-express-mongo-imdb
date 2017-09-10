'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var mongodb = require('./db/mongo');
module.exports = app; // for testing

// Swagger UI
const swaggerUI = require('swagger-ui-express');

// UUID Timestamp
var uuidTimestamp = require('uuid/v1');

// Bunyan Logger
var bunyan = require('./logger/bunyan');

// Swagger Doc Generator
var swaggerSpecGenerator = require('./swagger-doc-generator/generator').swaggerSpec;

// Rate Limiter
var RateLimit = require('express-rate-limit');
// app.enable('trust proxy'); // Used only when behind a reverse proxy, eg: Heroku
var apiLimiter = new RateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   delayMs: 0, // disabled 
   max: 100, // limit each IP to 100 requests per windowMs
   message: 'Too many requests from this IP, Please try again later!'
});

// Read key and cert
var fs = require('fs');
var httpsConfig = {
   key: fs.readFileSync('./certs/key.pem'),
   cert: fs.readFileSync('./certs/cert.pem')
};

var config = {
   appRoot: __dirname // required config
};

swaggerSpecGenerator(function (err, status) {
   if (err) {
      console.error(`Failed to generate swagger doc, ${err}`);
      process.exit(1);
   }

   SwaggerExpress.create(config, function (err, swaggerExpress) {
      if (err) {
         throw err;
      }

      // Serve the Swagger documents and Swagger UI
      const swaggerDocument = require('./api/swagger/swagger.json');
      app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument, true));

      // Middleware to UUID Timestamp to Express Request Object
      app.use(function (req, res, next) {
         req.uuidTimestamp = uuidTimestamp();
         next();
      });

      // Rate limiter middleware
      app.use(apiLimiter);

      // Redirect to docs page when root dir is requested
      app.get('/', function (req, res) {
         res.status(302).redirect('/api-docs/');
      });

      // install middleware
      swaggerExpress.register(app);

      // Global error handling middleware
      app.use(function (err, req, res, next) {
         return res.status(500).json({
            message: err.message
         });
      });

      var port = process.env.PORT || 10010;

      // Instantiate Bunyan logger
      bunyan.instantiateLogger();

      // Connect to MongoDB first and then listen for requests
      createConnection(port);
   });
});

/**
 * @function createConnection
 * @description Creates a new MongoDB connection
 * @param {Integer} port 
 */
async function createConnection(port) {
   let res = await mongodb.connect();
   if (res !== null) {
      console.error('Failed to connect to MongoDB instance');
      process.exit(1);
   } else {
      require('https').createServer(httpsConfig, app).listen(port, function () {
         console.info('server started on port: ', port);
      });
   }
};