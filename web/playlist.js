var sys = require('sys')
  , posix = require('posix')
  , redis = require('redis')
  , _ = require('underscore')._

process.mixin( require('utils') );

exports.add = function( id, song, cb ) {
    newRedis( function() {
        if( !song ) { cb(false); return ; }
        this.redis.sadd( $pls(id), song ).addCallback( function(added) {
            cb( added );
        });
    });
}

exports.member = function( plid, songid, cb ) {
    newRedis( function() {
        this.redis.sismember( $pls( plid ), songid ).addCallback(cb);
    });
}
