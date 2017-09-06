'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const MOVIES = 'MovieDoc'; // Collection name
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name fetchMovieDocById
 * @description Returns a list of docs for a particular movie
 * @param {object} req Express request object
 * @param {object} res Express request object
 */
function fetchMovieDocById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   let docType = req.swagger.params.type.value;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Movie: ${movieID}, DocType: ${docType}`);
   fetchDocs(id_route, movieID, docType, function (err, docList) {
      if (err) {
         return res.status(err.statusCode).json({
            message: err.message
         });
      }
      return res.json(docList);
   });
};

/**
 * @function @name fetchDocs
 * @description Helper function for @function @name fetchMovieDocById
 * @param {object} id_route Object containing unique request identifier and route info
 * @param {string} movieID Unique Movie ID of a particular movie
 * @param {string} docType Unique type of document to be returned
 * @param {function (err, docList)} callback 
 */
async function fetchDocs(id_route, movieID, docType, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let docList = await db.collection(MOVIES).find({
         $and: [{
            'MovieID': movieID
         }, {
            'DocType': docType
         }]
      }, {
         '_id': 0,
         'DocText': 1,
         'DocSubtype': 1,
         'DocAuthor': 1
      }).toArray();
      if ((Object.prototype.toString.call(docList) === '[object Array]') &&
         docList.length > 0) {
         logger.info(id_route, `Found ${docList.length} document(s) of type '${docType}' for '${movieID}'!`);
         return callback(null, docList);
      } else {
         logger.error(id_route, `Could not find any document(s) of type '${docType}' for '${movieID}'!`);
         return callback({
            statusCode: 500,
            message: `Could not find any document(s) of type '${docType}' for '${movieID}'!`
         });
      }
   } catch (err) {
      logger.error(id_route, err.message);
      return callback({
         statusCode: 500,
         message: err.message
      });
   }
};

// Export route handler
module.exports = {
   fetchMovieDocById
};