var sys = require('sys');
var nerve = require('./../deps/nerve/nerve');
var controllers = require('./controllers');
var _ = require('./../deps/underscore/underscore')._;

// define an application using request matcher/handler pairs
var app = [

	[/^\/play\/(\w+)/, function(req, res, hash) {
// TODO commented but not removed since its a good reference for the /song/ controller
//        var r = new redis.Client();
//        r.connect( function() {
//            r.get('song:'+hash).addCallback( function(meta) {
//                view.render('info', JSON.parse(meta), _(res.respond).bind(res));
//            });
//        });
	}],

    [/^\/songs/, controllers.listSongs ],

    [/^\/artists$/, controllers.listArtists ],
    [/^\/artists\/(\w+)?/, controllers.listArtists ],

    [/^\/artist\/(\w+)/, controllers.artist ],
    [/^\/album\/(\w+)/, controllers.album ],

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
