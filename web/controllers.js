var sys = require('sys');
var nerve = require('./../deps/nerve/nerve');
var pls = require('./genpls');
var redis = require('./../deps/redis-node/redis');
var view = require('./view');
var utils = require('./../utils');
var _ = require('./../deps/underscore/underscore')._;

// a little different
process.mixin( require('./../utils') )


var dbError = function(res) {
    return function() {
        view.output( res, 'error', { 
            message : "Error connecting to database"
            , status_code : 500
        });
    }
}

var redirectToReferer = function(req, res, message) {
    res.sendHeader( 303, { "Location" : req.headers['referer'] } );
    res.respond( message );
}

var playlist = exports.playlist = function( req, res, action, arg ) {

    var pls_id = req.session['session_id'];
    var actions = {
        'add': function() {
            playlist.add( pls_id, function(success) {
                if( success )
                    req.session['message'] = 'Song Added';
                else( success )
                    req.session['message'] = 'error';
                redirectToReferer( req, res );
            })
        }
      , 'remove': function() {}
      , 'download': function() {}
    };

    if( _.isFunction( actions[action] ) )
        actions[action]( arg );

    if( req.session['test'] )
        view.output( res, 'playlist', { 'greeting' : req.session['test'] } )

}

var listPlaylist = exports.listPlaylist = function( res ) {
    util.newRedis(
        function() {
        },
        dbError(res)
    );
}

exports.listArtists = function(req, res, page) {
    page = page || 0;
    utils.newRedis(
        function() {
            this.redis.lrange($artistnames(), page*10 || 0, (page*10 || 0)+10).addCallback(
            function(list) {
                view.output( res, 'artistlist', {
                    'artists':_.map(list || [], function(m) {
                                return JSON.parse(m);
                              })
                    , 'title': 'Artists'
                    , 'message' : req.session['message']
                });
            });
        },
        
        dbError(res)
    );
}

exports.artist = function(req, res, hash) {
    var output = {
        'songs':[]
      , 'message' : req.session['message']
    }
    utils.newRedis( function() {
        var r = this.redis;
        r.smembers( $artistsongs(hash) ).addCallback(
        function(songs) {
            _.each( songs, function(song, index) {
                r.get( $song(song) ).addCallback( function(s) {
                    output['songs'].push(JSON.parse(s));
                    if( index == songs.length - 1 ) {
                        // getting the artist from the song is cheating, but it works
                        // and is faster and cleaner than another redis query
                        output['title'] = "Artist - " + JSON.parse(s).artist;
                        view.output(res, 'artistsongs', output);
                    }
                });
            });
        });
    },

    dbError(res)
    );
}

exports.album = function(req, res, hash) {
    var output = {
        'songs':[]
      , 'message' : req.session['message']
    }
    utils.newRedis( function() {
        var r = this.redis;
        r.smembers( $albumsongs(hash) ).addCallback(
        function(songs) {
            _.each( songs, function(song, index) {
                r.get( $song(song) ).addCallback( function(s) {
                    output['songs'].push(JSON.parse(s));
                    if( index == songs.length - 1 ) {
                        // getting the artist from the song is cheating, but it works
                        // and is faster and cleaner than another redis query
                        output['songs'] = _.sortBy( output['songs'], function( song ) {
                            return song.track;
                        });
                        output['title'] = "Album - " + JSON.parse(s).album;
                        view.output(res, 'albumsongs', output);
                    }
                });
            });
        });
    },
    dbError(res)
    );
}


exports.listSongs = function(req, res) {
    var resp = "";
    utils.newRedis(function() {
        var r = this.redis;
        r.keys($song('*')).addCallback( function(songlist) {
            _.each(songlist, function( songkey, i ) {
                r.get(songkey).addCallback( function( songdata ) {
                    view.render('info', JSON.parse(songdata), function(out) {
                        resp += out;

                        if( i == songlist.length-1 ) {
                            res.respond( resp );
                            r.close();
                        }
                    });
                })
            });
            r.close();
        });
    },
    dbError(res)
    );
}

exports.songInfo = function( req, res, songhash ) {
    utils.newRedis( function() {
        this.redis.get($song(songhash)).addCallback( function(meta) {
                view.output(res, 'info', JSON.parse(meta));
        });
    },
    dbError(res)
    );
};
