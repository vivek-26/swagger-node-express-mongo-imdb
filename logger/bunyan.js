'use strict';

/**
 * @author Vivek Kumar
 */
var bunyan = require('bunyan');
var path = require('path');
var config = require('./config');

// Global logger instance
var _logger;

/**
 * @function @name instantiateLogger
 * @description Creates a new instance of bunyan logger and assigns it to 
 * global logger instance.
 */
function instantiateLogger() {
   _logger = bunyan.createLogger({
      name: config.key,
      streams: [{
         type: config.type,
         path: path.join(__dirname, '../', config.path),
         period: config.period,
         count: config.backup_files
      }]
   });
};

/**
 * @function @name getLogger
 * @description Returns the global logger instance
 * @returns @param {object} _logger Bunyan logger instance
 */
function getLogger() {
   return _logger;
};

// Export functions
module.exports = {
   instantiateLogger,
   getLogger
};