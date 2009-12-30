var sys = require('sys')
  , posix = require('posix')
,    _ = require('underscore')._
,    redis = require('redis')
,    nerve = require('nerve')
,    taglib = require('taglib')
,    sha1 = require('sha1')

process.mixin( require('utils') );

var sep = '/';

var hash = function( str ) {
    return ( new sha1.jsSHA(str) ).getHash("HEX");
}

var augmentInfo = function(tag, absfn) {
    return process.mixin( tag, {
        'filename' : absfn,
        'hash' : hash(absfn),
        'artistHash' : hash(tag.artist),
        'albumHash' : hash(tag.album)
    });
}

var Collection = exports.Collection = function( root ) {
    this.initialize( root );
}

sys.inherits( Collection, process.EventEmitter );

Collection.prototype.initialize = function( root ) {
    this.root = "";
    this.root = this.path( root );
    this.redis = new redis.Client();
    this.ready = false;

    var self = this;

    this.redis.connect( function() {
        self.emit( "ready" );
    })
}

Collection.prototype.path = function( fn ) {
    var path = _(fn.split(sep))
        .compact()
        .map( function(i) { 
            return i.replace(new RegExp("^" + sep), "")
                .replace(new RegExp(sep + "$"), "");
        } ).join(sep);

    return this.root + sep + path;
}

Collection.prototype.addFile = function( fn ) {
    var absfn = this.path(fn);

    var info = augmentInfo( taglib.getFileTags(absfn), absfn );

    sys.debug(sys.inspect(info));
    // add the song
    this.redis.setnx( $song( info.hash ), JSON.stringify(info) );

    // add the artist if he is new
    // The callback does this:
    // we want to treat the $artistnames()
    // as a list so that we can page it ( LRANGE )
    // but we still want set like unique behaviour
    // so we do a setnx(), if the key was set ( n == 1 )
    // we do a rpush, otherwise it already exists so we don't.
    // similar for albums
    //
    // NOTE what are the implications on concurrency
    // right now collection scanning is done by only one process
    // but what if it is distributed in the future? YAGNI for now
    var self = this;
    var n = 0;
    this.redis.setnx( $artist( info.artistHash ), info.artist ).addCallback(
    function(n) {
        if( n == 1 ) {
            self.redis.rpush( $artistnames(), JSON.stringify(
                { 'artist' : info.artist,
                  'hash' : info.artistHash }
            ));
        }
    });

    // add the album if it is new
    this.redis.setnx( $album( info.albumHash ), info.album )
    .addCallback( function( n ) {
        if( n == 1 ) {
            self.redis.rpush( $albumnames(), JSON.stringify(
                { 'album' : info.album,
                  'hash' : info.albumHash }
            ));
        }
    });

    // so that we can list songs by artists and albums
    this.redis.sadd( $artistsongs( info.artistHash ), info.hash );
    // TODO when using collection don't do process.exit
    this.redis.sadd( $albumsongs( info.albumHash ), info.hash ).addCallback(function() { process.exit(); });

}

var c = new Collection('/shared/music');
c.addListener( "ready", function() {
    _.each( process.ARGV.splice(2), function(fn) {
        c.addFile(fn.replace(new RegExp("^" + c.root + "?"), ""));
    } );
});
//process.exit();


////////////////////////////////////////////////////
/*

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
*/
/////////////////////////////////////////////////////
