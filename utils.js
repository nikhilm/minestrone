var sys = require('sys')
  , posix = require('posix')
  , _ = require('underscore')

/*
 * Accepts a list of arguments and converts it into
 * a ':' delimited redis key with prefix
 */
exports.k = function() {
    // TODO fix appname
    return [ 'appname' ].concat( _.toArray(arguments) ).join(':');
}

exports.songk = function(hash) {
    return exports.k( 'song', hash );
}

exports.plsk = function(id) {
    return exports.k( 'playlist', id );
}

exports.songInfo = function( hash, cb ) {
    // TODO
    //return exports.fetch( 'get', exports.songk( hash ), cb );
}
