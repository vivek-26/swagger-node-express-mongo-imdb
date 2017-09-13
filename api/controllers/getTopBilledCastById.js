'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const MOVIES = 'MovieRole'; // Collection name
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name fetchTopBilledCastById
 * @description Returns a list of top 5 billed cast of a Movie
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function fetchTopBilledCastById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Movie: ${movieID}`);
   fetchTopBilledCast(id_route, movieID, function (err, castList) {
      if (err) {
         return res.status(err.statusCode).json({
            message: err.message
         });
      }
      return res.json(castList);
   });
};

/**
 * @function @name fetchTopBilledCast
 * @description Helper function for @function @name fetchTopBilledCastById
 * @param {*} id_route Object containing unique request identifier and route info
 * @param {*} movieID Unique ID of a movie
 * @param {function (err, castList)} callback 
 */
async function fetchTopBilledCast(id_route, movieID, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let castList = await db.collection(MOVIES).aggregate([{
         $match: {
            $and: [{
               'MovieID': movieID
            }, {
               'ContribRoleDetail': {
                  $in: ['1', '2', '3', '4', '5']
               }
            }]
         }
      }, {
         $sort: {
            'ContribRoleDetail': 1
         }
      }, {
         $project: {
            '_id': 0,
            'ContribName': 1,
            'ContribClass': 1,
            'ContribRole': 1
         }
      }]).toArray();
      if ((Object.prototype.toString.call(castList) === '[object Array]') &&
         castList.length > 0) {
         logger.info(id_route, `Found ${castList.length} top billed cast for Movie: '${movieID}'!`);
         return callback(null, castList);
      } else {
         logger.error(id_route, `Could not find billed cast for Movie: '${movieID}'!`);
         return callback({
            statusCode: 404,
            message: `Could not find billed cast for Movie: '${movieID}'!`
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
   fetchTopBilledCastById
};