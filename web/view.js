var sys = require('sys')
  , posix = require('posix')
  , _ = require('./../deps/underscore/underscore')._

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

    var path = process.ENV['APPNAME_PATH'] + '/web/views/' + view + '.tp';
    posix.cat(path).addCallback( function( content ) {
        cb( _.template( content, data ) );
    })
    .addErrback( function() {
        throw new Error( "Error loading view " + view );
    });
}

/*
 * Expects a response object and directly calls
 * response.respond() with the final render
 * after including header and footer
 */
exports.output = function( response, view, data ) {
    var output = "";

    var hfdata = process.mixin({}, data);

    exports.render( 'header', hfdata, function(c) {
        output += c;

        exports.render( view, data, function(c) {
            output += c;

            exports.render( 'footer', hfdata, function(c) {
                output += c;

                response.respond( output );
            });
        });
    });
}
