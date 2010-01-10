var sys = require('sys');
var nerve = require('./../deps/nerve/nerve');
var controllers = require('./controllers');
var _ = require('./../deps/underscore/underscore')._;

// define an application using request matcher/handler pairs
var app = [

	[/^\/song\/(\w+)/, controllers.songInfo ],

    [/^\/songs/, controllers.listSongs ],

    [/^\/artists$/, controllers.listArtists ],
    [/^\/artists\/(\w+)?/, controllers.listArtists ],

    [/^\/artist\/(\w+)/, controllers.artist ],
    [/^\/album\/(\w+)/, controllers.album ],

    [/^\/playlist\/(\w+)/, controllers.playlist ],

    [/^.*$/, controllers.listArtists ]

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

// create and serve the application with various options
exports.start = function( port ) {
    nerve.create(app, {
        port: port
    }).serve();
}
