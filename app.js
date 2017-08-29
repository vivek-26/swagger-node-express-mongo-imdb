'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var mongodb = require('./db/mongo');
module.exports = app; // for testing

// Swagger UI
var swaggerUi = require('swagger-tools/middleware/swagger-ui');

// UUID Timestamp
var uuidTimestamp = require('uuid/v1');

// Bunyan Logger
var bunyan = require('./logger/bunyan');

var config = {
   appRoot: __dirname // required config
};

SwaggerExpress.create(config, function (err, swaggerExpress) {
   if (err) {
      throw err;
   }

   // Serve the Swagger documents and Swagger UI
   app.use(swaggerUi(swaggerExpress.runner.swagger));

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