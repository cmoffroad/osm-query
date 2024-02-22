#!/usr/bin/env node

const status = require('node-status');
const { program } = require('commander');

const package = require('../package.json');

const {
  createCategories,
  createQuery,
  createGeoJSON,
  exportGeoJSON,
  exportKML,
  openFile,
  processWays
} = require('./lib');

////////////////////////////////////////////////////////////////////////////////////////

console = status.console();

program
  .name(package.name)
  .version(package.version)
  .description(package.description)
  .requiredOption('-i, --input <path>', 'Path to the OSM input file (*.osm.pbf)')
  .requiredOption('-n, --names <names...>', 'List of category names')
  .requiredOption('-c, --colors <colors...>', 'CSS Color used to render categories (comma-separated, e.g., "green yellow orange red purple brown black"). Number of elements must match `names`.')
  .requiredOption('-q, --query <query>', 'General Overpass Query that applies to all ways')
  .requiredOption('-f, --filters <filters...>', 'Overpass Query to filter input ways (e.g. [smoothness=excellent]). Number of elements must match `names`.')
  .option('-k, --kml <path>', 'Output file path for the KML layers. (*.kml). Default is the input file path with .kml extension')
  .option('-g, --geojson <path>', 'Output file path for the GeoJSON layers. (*.geojson). Default is the input file path with .geojson extension')
  .option('-x, --open', 'Automatically open KML output file')
  .option('-w, --width [pixels]', 'The width of the gradient lines. (default: 2)', (val) => parseInt(val), 2)
  .option('-o, --opacity [float]', 'The opacity of the gradient lines. (default: 1.0)', (val) => parseFloat(val), 1.0)
  .parse(process.argv);

const command = `npx osm-gradients ${process.argv.slice(2).join(' ')}`

////////////////////////////////////////////////////////////////////////////////////

const { input, geojson, kml, names, colors, query, filters, open, width, opacity } = program.opts();

status.start({
  pattern: ` {spinner.cyan} {uptime.yellow} | Ways: {count.default.green}`,
  precision: 0
});

const categories = createCategories(names, colors, filters, width, opacity);

processWays(status.addItem('count'), input, categories, createQuery(query), (categoriesMap) => {

  const data = createGeoJSON(categories, categoriesMap);

  const pathGeoJSON = geojson || input.replace(/\.osm\.pbf$/, '.geojson');
  exportGeoJSON(pathGeoJSON, data);

  const pathXML = kml || input.replace(/\.osm\.pbf$/, '.kml');
  exportKML(pathXML, data, command);
  if (open) {
    openFile(pathXML)
  }

  process.exit(0);
});