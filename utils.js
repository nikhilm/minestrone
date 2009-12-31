var sys = require('sys')
  , posix = require('posix')
  , redis = require('redis')
  , _ = require('underscore')._

/*
 * Accepts a list of arguments and converts it into
 * a ':' delimited redis key with prefix
 */
exports.k = function() {
    return [ 'minestrone' ].concat( _.toArray(arguments) ).join(':');
}

exports.$song = function(hash) {
    return exports.k( 'song', hash );
}

exports.$artist = function(hash) {
    return exports.k( 'artist', hash );
}

// holds artist names and hash
// since the JSON string is {'artist':'artist name', 'hash': hash }
// we get automatic alphabetical ordering
// when using SORT * ALPHA
exports.$artistnames = function() {
    return exports.k( 'artistnames' );
}

// similarly for albums
exports.$albumnames = function() {
    return exports.k( 'albumnames' );
}

exports.$artistsongs = function(hash) {
    return exports.k( 'artist', hash, 'songs' );
}

exports.$album = function(hash) {
    return exports.k( 'album', hash );
}

exports.$albumsongs = function(hash) {
    return exports.k( 'album', hash, 'songs' );
}

exports.$pls = function(id) {
    return exports.k( 'playlist', id );
}

exports.die = function() {
    process.stdio.writeError(arguments[0] || "Error");
    process.stdio.writeError("\n");
    process.exit(1);
}

/* Passes cb to a new instance redis.Client.connect
 * but handles error in connecting
 * accepts optional errback as second argument
 * the callback gets a this.redis representing the redis object
 *
 * Returns nothing
 */
exports.newRedis = function( cb ) {
    var errback = arguments[1];

    var r = new redis.Client( GLOBAL.redis_host, GLOBAL.redis_port );

/* Useful for a blog post :)
    var callback_maker = function(cb) {
        return {
          redis : r,
          func : function() {
              return cb.apply(this, arguments);
          }
        };
    };

    var callback = callback_maker(cb);
    r.connect( _(callback.func).bind(callback) );
*/
    // XXX Will this be shared?
    r.connect( _.bind( cb, { redis : r } ) );

    r.addListener( "close", function(error) {
        if( error ) {
            process.stdio.writeError( "Error connecting to Redis database\n" );
            if( typeof(errback) === "function" )
                errback();
        }
    });
}

