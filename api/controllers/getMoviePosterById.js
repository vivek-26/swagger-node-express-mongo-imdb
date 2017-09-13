'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const TMDB_CONFIG = 'TMDB_API_CONFIG'; // Memory-Cache Key
const TMDB_CONFIG_URL = 'https://api.themoviedb.org/3/configuration';
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // API Key
var bunyan = require('./../../logger/bunyan');

const request = require('request-promise');
const promisify = require('promisify-node');
const cache = promisify(require('memory-cache'));

function fetchMoviePosterById(req, res) {
   let movieID = req.swagger.params.movieID.value;
   let device = req.swagger.params.device.value;
   let tmdbConfig = cache.get(TMDB_CONFIG);
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `Movie: ${movieID}`);
   fetchPoster(movieID, device, tmdbConfig, id_route, function (err, poster) {});
};

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
   await cache.put(TMDB_CONFIG, response.body);
   return response.body;
};

async function fetchPoster(movieID, device, tmdbConfig, id_route, callback) {
   let logger = bunyan.getLogger();
   try {
      if (!tmdbConfig) {
         tmdbConfig = await getTMDBAPIConfig();
      }
      /**
       * @todo Add the logic for fetching Movie Poster
       */

   } catch (err) {
      logger.error(id_route, err.message);
      return callback({
         statusCode: 500,
         message: err.message
      });
   }
};