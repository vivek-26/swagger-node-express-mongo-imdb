/**
 * @author Vivek Kumar
 * Module Dependencies
 */
var mongoClient = require('mongodb').MongoClient;
var dbConfig = process.env.MONGODB_URI || require('./config');

// Global variable for MongoDB Instance
var _db;

// Connection URL
var connectionURL = process.env.MONGODB_URI ||
   `mongodb://${dbConfig.username}:${dbConfig.password}` +
   `@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
// console.info('connectionURL', connectionURL);

/**
 * @function connect
 * @description Connect to MongoDB Database and set the global db object
 */
async function connect() {
   try {
      _db = await mongoClient.connect(connectionURL);
      if (_db) {
         return null;
      } else {
         return 'Connection Failed!';
      }
   } catch (err) {
      console.error(err);
      return err;
   }
};

/**
 * @function getDBInstance
 * @description Return the global db object
 */
function getDBInstance() {
   return _db;
};

// Export functions
module.exports = {
   connect,
   getDBInstance
};