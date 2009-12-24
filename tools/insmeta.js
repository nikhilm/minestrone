// node instmeta.js filename md5sum
var sys = require("sys");
var redis = require("./../deps/redis/redis");
var metadata = require("./../deps/taglib/taglib").getFileTags;

r = new redis.Client();
r.connect( function() {
    var a = metadata(process.ARGV[2]);
    a.filename = process.ARGV[2];
    a.hash = process.ARGV[3];
    r.set('song:'+process.ARGV[3], JSON.stringify(a)).addCallback( function() { r.close(); } );
});
