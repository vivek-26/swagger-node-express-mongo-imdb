'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const MOVIES = 'Movie'; // Collection name
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name fetchMovieListByGenre
 * @description Express route handler to fetch a list of movies of a particular 'Genre'
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function fetchMovieListByGenre(req, res) {
   let genre = req.swagger.params.genre.value;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Genre: ${genre}`);
   fetchMovieList(id_route, genre, function (err, movieList) {
      if (err) {
         return res.status(err.statusCode).json({
            error: err.message
         });
      }
      return res.json(movieList);
   });
};

async function fetchMovieList(id_route, genre, callback) {
   // Return dummy data for now
   return callback(null, {
      movieList: ['Dummy', 'Data', 'Here']
   });
};

// Export route handler
module.exports = {
   fetchMovieListByGenre
};