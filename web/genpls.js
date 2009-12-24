/*
 * Given a redis key, treats that as
 * a set of song IDs and generates a .pls file
 */

var sys = require("sys")
  , redis = require("./../deps/redis/redis")
  , _ = require("./../deps/underscore")._

// endpoint should be a prefix url like http://example.com/play/
// so that the playlist entries will be http://example.com/play/<hash>
var Playlist = exports.Playlist = function( song_endpoint ) {
    if( typeof( song_endpoint ) != "string" )
        throw "Expected endpoint";
    this.endpoint = song_endpoint;
};

Playlist.prototype.generate = function( key ) {
    this.promise = new process.Promise();

    this.redis = new redis.Client();
    this.playlistdata = [];

    var self = this;
    this.redis.connect( function() {
        self._makePlaylist(key);
    });

    this.redis.addListener( "close", function() {
        self.promise.emitSuccess( self._formatPlaylist( self.playlistdata ) );
    });

    return this;
},

Playlist.prototype.addCallback  = function( cb ) {
    this.promise.addCallback( cb );
    return this;
},

Playlist.prototype.addErrback  = function( cb ) {
    this.promise.addErrback( cb );
    return this;
},

Playlist.prototype._makePlaylist  = function (plid) {
    var playlist = [];

    var self = this;

    this.redis.smembers('playlist:'+plid)
    .addCallback( function( set ) {
        _.each( set, function(i) { self._fetchFileInfo.call(self, i); } );
        self.redis.close();
    })
    .addErrback( function() {
        self.promise.emitError();
    });
},

Playlist.prototype._fetchFileInfo  = function( i ) {
    var fn = null;
    var self = this;
    this.redis.get( i ).addCallback( function( val ) {
        self.playlistdata.push( JSON.parse(val) );
        //sys.debug( sys.inspect( self.playlistdata ) );
    });
}

Playlist.prototype._formatPlaylist = function( songs ) {
    var format = ["[playlist]", "numberofentries=" + songs.length];

    var self = this;
    var count = 0;
    format = format.concat( _.map( songs , function( song ) {
        count += 1;
        return [ "File"+count+"="+self.endpoint+song.hash,
          "Title"+count+"="+song.title ].join('\n');
    }));

    return format.join('\n');
}
