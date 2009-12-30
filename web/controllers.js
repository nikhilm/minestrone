var sys = require('sys');
var nerve = require('./../deps/nerve/nerve');
var pls = require('./genpls');
var redis = require('./../deps/redis-node/redis');
var view = require('./view');
var _ = require('./../deps/underscore/underscore')._;

// a little different
process.mixin( require('./../utils') )

exports.listArtists = function(req, res, page) {
    page = page || 0;
    var r = new redis.Client();
    r.connect( function() {
        r.lrange($artistnames(), page*10 || 0, (page*10 || 0)+10).addCallback(
        function(list) {
            view.output( res, 'artistlist', {
                'artists':_.map(list || [], function(m) {
                            return JSON.parse(m);
                          })
                , 'title': 'Artists'
            });
        });
    });
}

exports.artist = function(req, res, hash) {
    var r = new redis.Client();
    var output = {
        'songs':[]
    }
    r.connect( function() {
        r.smembers( $artistsongs(hash) ).addCallback(
        function(songs) {
            _.each( songs, function(song, index) {
                r.get( $song(song) ).addCallback( function(s) {
                    output['songs'].push(JSON.parse(s));
                    if( index == songs.length - 1 ) {
                        // getting the artist from the song is cheating, but it works
                        // and is faster and cleaner than another redis query
                        output['title'] = "Songs by " + JSON.parse(s).artist;
                        view.output(res, 'artistsongs', output);
                    }
                });
            });
        });
    });
}

exports.album = function(req, res, hash) {
    var r = new redis.Client();
    var output = {
        'songs':[]
    }
    r.connect( function() {
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
                        output['title'] = "Songs in " + JSON.parse(s).album;
                        view.output(res, 'albumsongs', output);
                    }
                });
            });
        });
    });
}


exports.listSongs = function(req, res) {
    var r = new redis.Client();
    var resp = "";
    r.connect( function() {
        r.keys(songk('*')).addCallback( function(songlist) {
            _.each(songlist, function( songkey, i ) {
                r.get(songkey).addCallback( function( songdata ) {
                    view.render('info', JSON.parse(songdata), function(out) {
                        resp += out;

                        if( i == songlist.length-1 ) {
                            res.respond( resp );
                            r.close();
                        }
                    });
                }).addErrback( function() {
                    res.respond("hi2");
                    res.finish();
                });
            });
            r.close();
        }).addErrback( function() {
            res.respond("hi3");
            res.finish();
        });
    });
}

