var sys = require('sys')
  , posix = require('posix')
  , utils = require('./utils')

GLOBAL['MINESTRONE_VERSION'] = '0.5';

var configFile = process.ENV['MINESTRONE_PATH'] + '/config.json';
// TODO better option parsing ( http://github.com/jfd/optparse-js ? )
if( process.ARGV[2] ) {
    configFile = process.ARGV[2];
}

// 1. Read config file
posix.cat( configFile )
.addCallback( function( data ) {
    try {
        var conf = JSON.parse(data);
    } catch(e) {
        utils.die("Error in configuration file " + configFile);
    }

    if( !conf.collection ) {
        utils.die("Please specify collection root in configuration file " + configFile);
    }

    process.mixin( GLOBAL, conf );

    var collection = require('./collection')
      , app = require('./web/app')

    // 2. Update collection
    var collection = new collection.Collection( conf.collection );
    
    // TODO change to port 80
    app.start( parseInt(conf.port) || 8000 );

})
.addErrback( function() {
    utils.die("Usage: ./run minestrone.js [config file]");
});
// 4. Start the web app
