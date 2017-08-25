'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var mongodb = require('./db/mongo');
module.exports = app; // for testing

// SwaggerUI
var swaggerTools = require('swagger-tools');
var YAML = require('yamljs');
var swaggerDoc = YAML.load('./api/swagger/swagger.yaml');

var config = {
   appRoot: __dirname // required config
};

SwaggerExpress.create(config, function (err, swaggerExpress) {
   if (err) {
      throw err;
   }

   // install middleware
   swaggerExpress.register(app);

   var port = process.env.PORT || 10010;

   swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
      // Serve the Swagger documents and Swagger UI
      app.use(middleware.swaggerUi());

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