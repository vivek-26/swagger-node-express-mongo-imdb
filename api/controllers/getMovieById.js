'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const MOVIES = 'Movie'; // Collection name
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name fetchMovieById
 * @description Express route handler to fetch a movie by ID
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function fetchMovieById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Movie ID: ${movieID}`);
   fetchMovie(id_route, movieID, function (err, movie) {
      if (err) {
         return res.status(err.statusCode).json({
            error: err.message
         });
      }
      return res.json(movie);
   });
};

/**
 * @function fetchMovie
 * @description Helper function for @function fetchMovieById
 * @param {string} movieID ID of the movie to get
 * @param {function (err, movie)} callback
 */
async function fetchMovie(id_route, movieID, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let movieCursor = await db.collection(MOVIES).find({
         $and: [{
            '_id': movieID
         }, {
            'SeriesType': 'F' // Movie is a 'feature'
         }]
      });
      let movieCount = await movieCursor.count();
      if (movieCount === 1) {
         logger.info(id_route, `Found movie with id ${movieID}`);
         let movieData = await movieCursor.nextObject();
         return callback(null, movieData);
      } else {
         logger.warn(id_route, `Could not find movie with id '${movieID}'`);
         return callback({
            statusCode: 404,
            message: `Could not find movie with id '${movieID}'`
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

module.exports = {
   fetchMovieById
};