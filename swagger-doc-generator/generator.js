/**
 * @author Vivek Kumar
 */
var promisify = require('promisify-node');
var fs = promisify('fs');
var glob = promisify(require('glob'));
const extendify = require('extendify');
const YAML = require('yaml-js');

const SOURCE = 'swagger-docs/**/*.yaml';
const TARGET = require('path').join(`${__dirname}/../api/swagger`);

/**
 * @function @name swaggerSpec
 * @description This function generates swagger specification document
 * @param {function (err, status)} callback 
 */
async function swaggerSpec(callback) {
   try {
      // Get a list of all yaml files in swagger-docs folder
      let yamlFiles = await glob(SOURCE);
      if (yamlFiles.length === 0) {
         return callback('YAML files not found!');
      }

      // Load all yaml files
      const yamlContents = yamlFiles.map(file => {
         return YAML.load(fs.readFileSync(file).toString());
      });

      // Merge the contents
      const extend = extendify({
         inPlace: false,
         isDeep: true
      });
      const mergedContent = yamlContents.reduce(extend);

      // Write 'swagger.yaml' and 'swagger.json' to '../api/swagger' directory
      fs.existsSync(TARGET) || fs.mkdirSync(TARGET);
      await fs.writeFile(`${TARGET}/swagger.yaml`, YAML.dump(mergedContent));
      await fs.writeFile(`${TARGET}/swagger.json`, JSON.stringify(mergedContent, null, 3));
      return callback(null, 'done!');
   } catch (err) {
      return callback(`Error: ${err.message}`);
   }
};

// Export function
module.exports = {
   swaggerSpec
};