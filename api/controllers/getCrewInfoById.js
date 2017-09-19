'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const MOVIES = 'MovieRole';
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name fetchCrewInfoById
 * @description Get crew member(s) details based on 'role' for a particular Movie ID
 * @param {object} req Express request object 
 * @param {object} res Express response object
 */
function fetchCrewInfoById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   let role = req.swagger.params.role.value
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Movie: ${movieID}; Role: ${role}`);
   fetchCrewInfo(id_route, movieID, role, function (err, crewDetails) {
      if (err) {
         return res.status(err.statusCode).json({
            message: err.message
         });
      }
      return res.json(crewDetails);
   });
};

/**
 * @function @name fetchCrewInfo
 * @description Helper function for @function @name fetchCrewInfoById
 * @param {*} id_route Object containing unique request identifier and route info 
 * @param {*} movieID Unique IMDB ID of the movie
 * @param {*} role 'directors', 'producers', 'writers'
 * @param {function (err, crewDetails)} callback 
 */
async function fetchCrewInfo(id_route, movieID, role, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let crewDetails = await db.collection(MOVIES).find({
         $and: [{
            'MovieID': movieID
         }, {
            'SeriesType': 'F'
         }, {
            'ContribClass': role
         }]
      }, {
         '_id': 0,
         'ContribName': 1,
         'ContribRoleDetail': 1
      }).toArray();
      if ((Object.prototype.toString.call(crewDetails) === '[object Array]') &&
         crewDetails.length > 0) {
         logger.info(id_route, `Found ${crewDetails.length} crew member(s) with Role: '${role}', for Movie: '${movieID}'!`);
         return callback(null, crewDetails);
      } else {
         logger.error(id_route, `Could not find any crew member(s) with Role: '${role}', for Movie: '${movieID}'!`);
         return callback({
            statusCode: 404,
            message: `Could not find any crew member(s) with Role: '${role}', for Movie: '${movieID}'!`
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
   fetchCrewInfoById
};