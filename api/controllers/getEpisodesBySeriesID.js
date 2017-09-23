'use strict';

/**
 * @author Vivek Kumar
 */
var mongo = require('../../db/mongo');
const TV = 'Movie';
var bunyan = require('./../../logger/bunyan');

/**
 * @function @name fetchEpisodesBySeriesID
 * @description Route handler to fetch all episodes of a Series
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
function fetchEpisodesBySeriesID(req, res) {
   let seriesID = req.swagger.params.seriesID.value;
   let logger = bunyan.getLogger(),
      id_route = {
         reqId: req.uuidTimestamp,
         route: req.url
      };
   logger.info(id_route, `TV Series: ${seriesID}`);
   fetchAllEpisodes(seriesID, id_route, function (err, episodeList) {
      if (err) {
         return res.status(err.statusCode).json({
            message: err.message
         });
      }
      return res.json(episodeList);
   });
}

/**
 * @function @name fetchAllEpisodes
 * @description Helper function for @function @name fetchEpisodesBySeriesID
 * @param {string} seriesID IMDB Series ID 
 * @param {object} id_route Object containing unique request identifier and route info
 * @param {function (err, episodeList)} callback 
 */
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
      if (episodeList.length > 0) {
         for (let index in episodeList) {
            if (!episodeList[index].Episodes.length > 0) {
               logger.error(id_route, `Could not find episode(s) for season ${(+index) + 1}, Series: ${seriesID}!`);
               return callback({
                  statusCode: 404,
                  message: `Could not find episode(s) for season ${(+index) + 1}, Series: ${seriesID}!`
               });
            }
         }
         logger.info(id_route, `Found episodes for ${episodeList.length} season(s) of Series: ${seriesID}!`);
         return callback(null, episodeList);
      } else {
         logger.error(id_route, `Could not any episode(s) for Series: ${seriesID}!`);
         return callback({
            statusCode: 404,
            message: `Could not any episode(s) for Series: ${seriesID}!`
         });
      }
      return callback(null, episodeList);
   } catch (err) {
      logger.error(id_route, err.message);
      return callback({
         statusCode: 500,
         message: err.message
      });
   }
};

/**
 * @function @name processEpisodesArray
 * @param {array} episodes Array containing all the episodes of a Series **Random Order** 
 */
async function processEpisodesArray(episodes) {
   let processedEpisodes = await Promise.all(episodes.map(async (episode) => {
      return await extractEpisodeData(episode);
   }));
   const totalSeasons = [...new Set(processedEpisodes.map(episode => episode.episodeSeason))];
   let episodeList = [];
   for (let season in totalSeasons) {
      episodeList.push({
         'Season': (+season) + 1,
         'Episodes': []
      });
   }
   for (let episode of processedEpisodes) {
      episodeList[episode.episodeSeason - 1].Episodes.push({
         episodeNumber: episode.episodeNumber,
         episodeName: episode.episodeName
      });
   }
   for (let season in episodeList) {
      episodeList[season].Episodes.sort(sortEpisodes);
   }
   return episodeList;
};

/**
 * @function @name extractEpisodeData
 * @param {object} episode 
 */
async function extractEpisodeData(episode) {
   let episodeId = episode.MovieID.match(/{(.*?)}/)[1];
   let episodeNS = episodeId.match(/\((#.*?)\)/)[1];
   let episodeName = episodeId.replace(episodeId.match(/\((#.*?)\)/)[0], '').trim();
   let episodeSeason = +episodeNS.split('.')[0].replace('#', '');
   let episodeNumber = +episodeNS.split('.')[1];
   return {
      episodeName,
      episodeSeason,
      episodeNumber
   };
}

/**
 * @function @name sortEpisodes
 * @description Function to sort episodes
 * @param {object} a 
 * @param {object} b 
 */
function sortEpisodes(a, b) {
   return a.episodeNumber - b.episodeNumber;
}

// Expose route handler
module.exports = {
   fetchEpisodesBySeriesID
};