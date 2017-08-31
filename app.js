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

var config = {
   appRoot: __dirname // required config
};

swaggerSpecGenerator(function (err, status) {
   if (err) {
      console.error(`Failed to generate swagger doc, Error: ${err}`);
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

      // install middleware
      swaggerExpress.register(app);

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
      app.listen(port);
      console.info('server started on port: ', port);
   }
};