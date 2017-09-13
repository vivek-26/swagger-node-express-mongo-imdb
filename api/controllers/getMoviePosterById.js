'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const TMDB_CONFIG = 'TMDB_API_CONFIG'; // Memory-Cache Key
const TMDB_CONFIG_URL = 'https://api.themoviedb.org/3/configuration';
const TMDB_MOVIE_SEARCH = 'https://api.themoviedb.org/3/search/movie';
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // API Key
var bunyan = require('./../../logger/bunyan');

const request = require('request-promise');
const promisify = require('promisify-node');
const cache = promisify(require('memory-cache'));

/**
 * @function @name fetchMoviePosterById 
 * @description Wrapper around TMDB to get Movie Poster by it's IMDB Title
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function fetchMoviePosterById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   let device = req.swagger.params.device.value;
   let tmdbConfig = cache.get(TMDB_CONFIG);
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Movie: ${movieID}; Device: ${device}`);
   fetchPoster(movieID, device, tmdbConfig, id_route, function (err, poster) {
      if (err) {
         return res.status(err.statusCode).json({
            message: err.message
         });
      }
      return res.json(poster);
   });
};

/**
 * @function @name getTMDBAPIConfig
 * @description Function to get TMDB API Configuration
 * @returns @param {object} response Object containing TMDB API Config
 */
async function getTMDBAPIConfig() {
   let options = {
      method: 'GET',
      url: TMDB_CONFIG_URL,
      qs: {
         api_key: TMDB_API_KEY
      },
      body: '{}',
      json: true // automatically parse json response
   };

   let response = await request(options);
   await cache.put(TMDB_CONFIG, response, 604800000);
   return response;
};

/**
 * @function @name fetchPoster
 * @description Helper function for @function @name fetchMoviePosterById
 * @param {string} movieID ID of the movie whose poster has to be fetched 
 * @param {string} device Type of device, eg - 'desktop' or 'mobile' 
 * @param {object} tmdbConfig TMDB API Configuration
 * @param {object} id_route Object containing unique request identifier and route info 
 * @param {function (err, poster)} callback 
 */
async function fetchPoster(movieID, device, tmdbConfig, id_route, callback) {
   let logger = bunyan.getLogger();
   try {
      if (!tmdbConfig) {
         tmdbConfig = await getTMDBAPIConfig();
      }
      let movieName = movieID.substring(0, movieID.lastIndexOf('('));
      let movieYear = +movieID.substring(movieID.lastIndexOf('(') + 1, movieID.lastIndexOf(')'));
      let deviceId = (device == 'desktop') ? 4 : 2;
      let options = {
         method: 'GET',
         url: TMDB_MOVIE_SEARCH,
         qs: {
            api_key: TMDB_API_KEY,
            language: 'en-US',
            query: movieName,
            page: 1,
            include_adult: true,
            year: movieYear
         },
         body: '{}',
         json: true
      };

      let response = await request(options);
      if (response && response.results.length > 0) {
         let posterPath = response.results[0].poster_path;
         let poster = {
            image_url: `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.poster_sizes[deviceId]}${posterPath}`
         };
         logger.info(id_route, `Found poster path ${posterPath} for movie ${movieID}, Device: ${device}`);
         return callback(null, poster);
      } else {
         logger.error(id_route, `Could not find any poster for movie ${movieID}!`);
         return callback({
            statusCode: 404,
            message: `Could not find any poster for movie ${movieID}!`
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
   fetchMoviePosterById
};