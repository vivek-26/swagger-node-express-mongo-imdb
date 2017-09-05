'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const MOVIES = 'Movie'; // Collection name
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name search
 * @description Returns a list of movies matching Search String
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function search(req, res) {
   let type = req.swagger.params.type.value;
   if (type == 'movie') {
      type = 'F';
   } else if (type == 'tv') {
      type = 'S';
   } else {
      return res.status(404).json({
         message: `${type} is not a valid value!`
      });
   }
   let searchStr = req.swagger.params.name.value;
   let limit = req.swagger.params.limit.value || 10;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Type: ${type}, Search String: ${searchStr}, Limit: ${limit}`);
   fetchMovieListBySearchString(id_route, type, searchStr, limit, function (err, movieList) {
      if (err) {
         return res.status(err.statusCode).json({
            message: err.message
         });
      }
      return res.json(movieList);
   });
};

/**
 * @function @name fetchMovieListBySearchString
 * @description Helper function for search route
 * @param {object} id_route Object containing unique request identifier and route info
 * @param {*} type Indicates Movie or TV Series
 * @param {*} searchStr The string to be matched 
 * @param {*} limit Number of records to be returned
 * @param {function (err, movieList)} callback 
 */
async function fetchMovieListBySearchString(id_route, type, searchStr, limit, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let movieList = await db.collection(MOVIES).aggregate([{
         $match: {
            $and: [{
               'MovieID': new RegExp(`^${searchStr}.*`)
            }, {
               'SeriesType': type
            }, {
               'Rating': {
                  $exists: true
               }
            }]
         }
      }, {
         $sort: {
            'Rating.RatingVotes': -1
         }
      }, {
         $project: {
            '_id': 0,
            'MovieID': 1,
            'Rating.Rating': 1
         }
      }, {
         $limit: limit
      }]).toArray();
      if ((Object.prototype.toString.call(movieList) === '[object Array]') &&
         movieList.length > 0) {
         logger.info(id_route, `Found ${movieList.length} suggestions for '${searchStr}'!`);
         return callback(null, movieList);
      } else {
         logger.error(id_route, `Could not find any suggestion for '${searchStr}'!`);
         return callback({
            statusCode: 500,
            message: `Could not find any suggestion for '${searchStr}'!`
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
   search
};