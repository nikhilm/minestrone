var sys = require('sys')
  , posix = require('posix')
  , _ = require('./../deps/underscore')._

/*
 * Returns a view
 * render( view, callback )
 * render( view, data, callback )
 * If data is specified, returns the rendered template using underscore.js
 * Otherwise only returns the view itself
 * Since this hits the disk it uses callbacks
 */
exports.render = function( view ) {
    var self = this;

    var cb = arguments[1];
    var data = null;
    if( arguments.length == 3 ) {
        data = arguments[1];
        cb = arguments[2];
    }

    posix.cat('views/'+view+'.tp').addCallback( function( content ) {
        cb( _.template( content, data ) );
    })
    .addErrback( function() {
        throw "Error loading view " + view;
    });
}
