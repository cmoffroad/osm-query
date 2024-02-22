const fs = require('fs');
const async = require('async');
const osmium = require('osmium');
const hgt = require('node-hgt');
const haversine = require('haversine');
const tokml = require('tokml');
const child_process = require('child_process');

const colorsMap = require('./colors');

const PATTERN_KEY = '([^!=~]+)';
const PATTERN_VALUE = PATTERN_KEY;

function createQuery (filter) {
  return filter
      .split(/\]|\[/)
      .filter(s => s.length)
      .map(i =>  {
        let m;
        if (m = i.match(`^${PATTERN_KEY}$`)) {
          /* exists */ return `( o.tags["${m[1]}"] !== undefined )`;
        } else if (m = i.match(`^!${PATTERN_KEY}$`)) {
          /* not exist */ return `( o.tags["${m[1]}"] === undefined )`;
        } else if (m = i.match(`^${PATTERN_KEY}=${PATTERN_VALUE}$`)) {
          /* equals */ return `( o.tags["${m[1]}"] == "${m[2]}" )`;
        } else if (m = i.match(`^${PATTERN_KEY}!=${PATTERN_VALUE}$`)) {
          /* note equals */ return `( o.tags["${m[1]}"] !== undefined && o.tags["${m[1]}"] != "${m[2]}" )`;
        } else if (m = i.match(`^${PATTERN_KEY}~${PATTERN_VALUE},i$`)) {
          /* matches value */ return `( o.tags["${m[1]}"] !== undefined && o.tags["${m[1]}"].match(new RegExp("${m[2]}", "i")) )`;
        } else if (m = i.match(`^${PATTERN_KEY}!~${PATTERN_VALUE},i$`)) {
          /* not match value */ return `( o.tags["${m[1]}"] !== undefined && !o.tags["${m[1]}"].match(new RegExp("${m[2]}", "i")) )`;
        } else if (m = i.match(`^~${PATTERN_KEY}~${PATTERN_VALUE},i$`)) {
          /* matches key value */ return `( Object.keys(o.tags).some(k => k.match(new RegExp("${m[1]}", "i")) && o.tags[k].match(new RegExp("${m[2]}", "i"))) )`;
        } else {
          return `false`
        }
      })
      .join(` && `)
}

const evalObject = (o, template) => {
  return eval(template);
};

const createCategories = function (names, colors, filters, width, opacity) {
  return names.map((name, index) => {
    const color = colors[index];
    const filter = filters[index];

    return {
      name,
      filter,
      eval: createQuery(filter),
      stroke: colorsMap[color] || color,
      "stroke-width": width,
      "stroke-opacity": opacity
    };
  });
};

const initializeArray = function (length) {
  return Array.from({ length }, () => new Array());
};

const filterWay = (way, query) => {
  const object = {
    ...way,
    tags: way.tags()
  };
  return object.type === 'way' && evalObject(object, query);
}

const processWays = (processWaysJob, input, categories, query, cb) => {
  const file = new osmium.File(input);
  const reader = new osmium.Reader(file, { node: true, way: true });
  const locationHandler = new osmium.LocationHandler();
  const handler = new osmium.Handler();
  const tasks = [];
  const categoriesMap = initializeArray(categories.length);

  handler.on('way', way => {
    const categoryIndex = categories.findIndex(c => filterWay(way, [query, c.eval].join(' && ')));
    const category = categories[categoryIndex];
    if (category) {
      try {
        tasks.push(cb => {
          const wayId = way.id;
          const coords = way.node_coordinates().map(c => ([ c.lon, c.lat]));
          categoriesMap[categoryIndex].push(coords);
          processWaysJob.inc();
          cb(undefined, categoriesMap);
        });
      } catch (e) {
        console.warn(`Error for way ${way.id}: ${e.message}`);
        return;
      }
    }
  });

  const next = () => {
    tasks.length = 0;
    const buffer = reader.read();

    if (buffer) {
      osmium.apply(buffer, locationHandler, handler);
      async.parallelLimit(tasks, 4, err => {
        if (!err) {
          setImmediate(() => next());
        } else {
          console.error(err);
          process.exit(1);
        }
      });
    } else {
      cb(categoriesMap);
    }
  };

  next();
}

const createGeoJSON = (categories, categoriesMap) => {

  const geojson = {
    type: 'FeatureCollection',
    features: categories.map((category, index) => ({
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: categoriesMap[index],
      },
      properties: category,
    })),
  };

  return geojson;
};

const exportGeoJSON = (path, geojson) => {
  fs.writeFileSync(path, JSON.stringify(geojson, null));
}

const exportKML = (path, geojson, command) => {
  const kml = tokml(geojson, {
    documentName: path,
    documentDescription: command,
    name: 'name',
    simplestyle: true
  });

  fs.writeFileSync(path, kml);
}

const openFile = (path) => {
  child_process.exec(`open ${path}`);
}

module.exports = {
  createGeoJSON,
  createQuery,
  createCategories,
  exportGeoJSON,
  exportKML,
  openFile,
  processWays
}