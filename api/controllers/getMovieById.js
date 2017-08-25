'use strict';

var mongo = require('../../db/mongo');
const MOVIES = 'Movie'; // Collection name

/**
 * @function @name fetchMovieById
 * @description Express route handler to fetch a movie by ID
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function fetchMovieById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   fetchMovie(movieID, function (err, movie) {
      if (err) {
         return res.status(err.statusCode).json({
            error: err.message
         });
      }
      return res.json({
         result: movie
      });
   });
};

/**
 * @function fetchMovie
 * @description Helper function for @function fetchMovieById
 * @param {string} movieID ID of the movie to get
 * @param {function (err, movie)} callback
 */
async function fetchMovie(movieID, callback) {
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
         let movieData = await movieCursor.nextObject();
         return callback(null, movieData);
      } else {
         return callback({
            statusCode: 404,
            message: `Could not find movie with id '${movieID}'`
         });
      }
   } catch (err) {
      console.error('(Error)fetchMovieById - ', err.message);
      return callback({
         statusCode: 500,
         message: err.message
      });
   }
};

module.exports = {
   fetchMovieById
};