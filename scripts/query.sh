# node src/index.js -o \
# 	-i data/berlin-latest.osm.pbf \
# 	-q [highway][highway!=path][highway!=footway][highway!=cycleway] \
# 	-n very_horrible horrible very_bad intermediate good \
# 	-c black red orange yellow green \
# 	-f [smoothness=very_horrible] [smoothness=horrible] [smoothness=very_bad] [smoothness=intermediate] [smoothness]


# node src/index.js -o \
# 	-i data/chiangmai-231126.osm.pbf \
#  	-q [highway] \
#  	-n trunk primary secondary tertiary unclassified \
#  	-c purple red yellow green cyan  \
#  	-f [highway=trunk] [highway=primary] [highway=secondary] [highway=tertiary] [highway=unclassified] \
#  	-k data/highways.kml

# node src/index.js -o \
# 	-i data/chiangmai-latest.osm.pbf \
#  	-q [highway] \
#  	-n beginner intermediate advance pro unknown \
#  	-c green yellow orange red grey  \
#  	-f [dirtbike:scale=0] [dirtbike:scale=1] [dirtbike:scale=2] [dirtbike:scale=3] [dirtbike:scale=4] [dirtbike:scale=?] \
#  	-k data/dirtbike.kml

# osmium extract --bbox=98.29,18.18,99.59,19.7 --set-bounds --strategy=smart thailand-latest.osm.pbf  --output chiangmai-latest.osm.pbf

CATEGORY=main-roads
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"trunk|primary|secondary|tertiary",i] \
 	-n $CATEGORY \
 	-c red  \
 	-f [!dirtbike:scale] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=paved-roads
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"unclassified|service|residential|track",i] \
 	-n $CATEGORY \
 	-c red  \
 	-f [!dirtbike:scale][source~"GPS",i][surface~"^(paved|concrete|asphalt)",i] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=dirt-roads
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"secondary|tertiary|unclassified|residential|service",i] \
 	-n $CATEGORY \
 	-c blue  \
 	-f [dirtbike:scale~"0|1",i] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=dirt-tracks
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"track",i] \
 	-n $CATEGORY \
 	-c green  \
 	-f [dirtbike:scale~"0|1",i] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=unknown-tracks
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"unclassified|residential|service|track",i] \
 	-n $CATEGORY \
 	-c grey  \
 	-f [dirtbike:scale="?"] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=easy-trails
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"path|footway",i] \
 	-n $CATEGORY \
 	-c yellow  \
 	-f [dirtbike:scale~"0|1",i] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=intermediate-trails
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway] \
 	-n $CATEGORY \
 	-c orange  \
 	-f [dirtbike:scale=2] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=advanced-trails
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway] \
 	-n $CATEGORY \
 	-c red  \
 	-f [dirtbike:scale~"3|4|5|6",i] \
 	-k "./public/off-road/$CATEGORY.kml"

CATEGORY=unknown-trails
node src/index.js -o \
	-i ./data/chiangmai-latest.osm.pbf \
	-q [highway~"path|footway",i] \
 	-n $CATEGORY \
 	-c grey  \
 	-f [dirtbike:scale="?"] \
 	-k "./public/off-road/$CATEGORY.kml"
