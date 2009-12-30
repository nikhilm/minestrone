var posix = require("posix");
var sys = require('sys');
var nerve = require('./../deps/nerve/nerve');
var pls = require('./genpls');
var redis = require('./../deps/redis-node/redis');
var view = require('./view');
var _ = require('./../deps/underscore/underscore')._;

// a little different
process.mixin( require('./../utils') )

function listArtists(req, res, page) {
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

function artist(req, res, hash) {
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

function album(req, res, hash) {
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


function listSongs(req, res) {
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

// define an application using request matcher/handler pairs
var app = [

	[/^\/play\/(\w+)/, function(req, res, hash) {
        var r = new redis.Client();
        r.connect( function() {
            r.get('song:'+hash).addCallback( function(meta) {
                view.render('info', JSON.parse(meta), _(res.respond).bind(res));
            });
        });
	}],

    [/^\/songs/, listSongs ],

    [/^\/artists$/, listArtists ],
    [/^\/artists\/(\w+)?/, listArtists ],

    [/^\/artist\/(\w+)/, artist],
    [/^\/album\/(\w+)/, album],

	// this handler will respond to any request method
//	[/b.*/, function(req, res) {
//        var p = new pls.Playlist( "http://localhost/play/" );
//        p.generate(1).addCallback( function( r ) {
//            res.respond({
//                headers: { "Content-Type" : "audio/x-scpls" }
//                , content: r
//            });
//        });
//  }]
	
];
process.addListener("SIGINT", function() {
    sys.debug("called");
    process.exit();
});

// create and serve the application with various options
nerve.create(app, {
    port: 8000
}).serve();
