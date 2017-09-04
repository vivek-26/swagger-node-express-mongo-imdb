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
   let pageNumber = req.swagger.params.page.value || 1;
   let numOfRecords = req.swagger.params.count.value || 10;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Genre: ${genre}, Page Number: ${pageNumber}, Count: ${numOfRecords}`);
   fetchMovieList(id_route, genre, pageNumber, numOfRecords, function (err, movieList) {
      if (err) {
         return res.status(err.statusCode).json({
            error: err.message
         });
      }
      return res.json(movieList);
   });
};

async function fetchMovieList(id_route, genre, pageNumber, numOfRecords, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let limit = pageNumber * numOfRecords,
         skip = (pageNumber - 1) * numOfRecords;
      let movieList = await db.collection(MOVIES).aggregate([{
         $match: {
            $and: [{
               'Genres': genre
            }, {
               'SeriesType': 'F'
            }, {
               'ReleaseYear': {
                  $gt: new Date().getFullYear() - 2,
                  $lt: new Date().getFullYear() + 1
               }
            }]
         }
      }, {
         $sort: {
            'ReleaseYear': -1,
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
      }, {
         $skip: skip
      }]).toArray();
      if ((Object.prototype.toString.call(movieList) === '[object Array]') &&
         movieList.length > 0) {
         logger.info(id_route, `Found ${movieList.length} records for Genre: ${genre}!`);
         return callback(null, movieList);
      } else {
         logger.error(id_route, `Could not fetch a list of movies for Genre: ${genre}`);
         return callback({
            statusCode: 500,
            message: `Could not get movie list for genre ${genre}`
         });
      }
   } catch (err) {
      logger.error(id_route, err.message);
      return callback({
         statusCode: 500,
         message: err.message
      });
   }
}

// Export route handler
module.exports = {
   fetchMovieListByGenre
};