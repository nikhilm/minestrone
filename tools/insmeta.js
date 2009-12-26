// node instmeta.js filename md5sum
var sys = require("sys");
var redis = require("redis");
var metadata = require("taglib").getFileTags;
var songk = require("utils").songk;

r = new redis.Client();
r.connect( function() {
    var a = metadata(process.ARGV[2]);
    a.filename = process.ARGV[2];
    a.hash = process.ARGV[3];
    r.set(songk(process.ARGV[3]), JSON.stringify(a)).addCallback( function() { r.close(); } );
});
