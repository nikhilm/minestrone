var posix = require("posix");
var sys = require('sys');
var nerve = require('./../deps/nerve/nerve');
var pls = require('./genpls');
var redis = require('./../deps/redis/redis');
var utils = require('./utils');

function listSongs(req, res) {
    var r = new redis.Client();
    var resp = "";
    r.connect( function() {
        r.keys('song:*').addCallback( function(songlist) {
            _.each(songlist, function( songkey, i ) {
                r.get(songkey).addCallback( function( songdata ) {
                    utils.render('info', JSON.parse(songdata), function(out) {
                        resp += out;
                    });
                    if( i == songlist.length-1 ) {
                        res.respond( resp );
                        r.close();
                    }
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
                utils.render('info', JSON.parse(meta), _(res.respond).bind(res));
            });
        });
	}],

    [/^\/songs/, listSongs ],

	// this handler will respond to any request method
	[/a.*/, function(req, res) {
        var p = new pls.Playlist( "http://localhost/play/" );
        p.generate(1).addCallback( function( r ) {
            res.respond({
                headers: { "Content-Type" : "audio/x-scpls" }
                , content: r
            });
        });
		
	}]
	
];

// create and serve the application with various options
nerve.create(app, {
    port: 8000
}).serve();
