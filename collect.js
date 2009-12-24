var sys = require('sys')
  , posix = require('posix')
  , redis = require('./deps/redis/redis')
  , taglib = require('./deps/taglib/taglib')

var r = new redis.Client();
r.addListener( "close", function(error) {
        sys.debug("CLOSE Error? " + error);
});

var ready = function() {
    sys.debug("HERE");
    collect();
    r.quit();
};
r.connect( ready );

var collect = function() {
    posix.readdir(process.ARGV[2]).addCallback( function ( names ) {
      names.forEach( function(n) {
        posix.stat(process.ARGV[2]+n).addCallback( function( c, p ) {
            sys.debug(sys.inspect(taglib.getFileTags(process.ARGV[2]+n)));
        });
      });
    });
};
