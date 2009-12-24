var sys = require("sys")

process.watchFile(process.ARGV[2], function( curr, prev ) {
    sys.debug("dir? " + ( curr.mode & process.S_IFDIR != 0 ) );
    sys.debug( sys.inspect(curr));
    sys.debug( curr.isFile() );
});
