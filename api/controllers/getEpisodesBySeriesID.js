'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const TV = 'Movie';
var bunyan = require('./../../logger/bunyan');

function fetchEpisodesBySeriesID(req, res) {
   let seriesID = req.swagger.params.seriesID.value;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `TV Series: ${seriesID}`);
   fetchAllEpisodes(seriesID, id_route, function (err, episodeList) {
      return res.status(404).json({
         message: 'In Progress :P'
      });
   });
}

async function fetchAllEpisodes(seriesID, id_route, callback) {
   let logger = bunyan.getLogger();
   try {
      let db = mongo.getDBInstance();
      let episodes = await db.collection(TV).find({
         $and: [{
            'SeriesID': seriesID
         }, {
            'SeriesType': 'E'
         }, {
            'Rating': {
               $exists: true
            }
         }]
      }, {
         '_id': 0,
         'MovieID': 1,
         'Rating.Rating': 1
      }).toArray();
      let episodeList = await processEpisodesArray(episodes);
      return callback(null, null);
   } catch (err) {
      logger.error(id_route, err.message);
      return callback({
         statusCode: 500,
         message: err.message
      });
   }
};

async function processEpisodesArray(episodes) {
   let results = await Promise.all(episodes.map(async(episode) => {
      return {
         'episodeName': episode.MovieID
      };
   }));
   console.log('results array', results);
   return null;
};

/**
 * Schema
[
	{
		"Season": "",
		"Episodes": [{
			"episodeNumber": 1,
			"episodeName": "The Flash Begins"
		}]
	},
	{
		"S02": []
	},
	{
		"S03": []
	}
]

var subsubstr = substr.match(/\((.*?)\)/)
str.match(/{(.*?)}/)[1]
 */

// Expose route handler
module.exports = {
   fetchEpisodesBySeriesID
};