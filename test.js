var tcp = require("tcp");
var sys = require("sys");
var posix = require("posix");
var file = require("file");

var addHeader = function( name, value ) {
    return name + ": " + value + "\r\n";
}

var server = tcp.createServer(function (socket) {
  socket.setEncoding("utf8");
  socket.addListener("receive", function (data) {
      sys.debug("Headers:");
      sys.debug(data);

      var reply = "ICY 200 OK\r\n";
      reply += addHeader( "Content-Type:", "audio/mpeg" );
      reply += addHeader( "icy-metaint", "16384" );
      reply += addHeader( "icy-notice1", "Pretty cool" );
      reply += addHeader( "icy-genre", "Hindi" );
      reply += addHeader( "icy-name", "ChilldBeats" );
      reply += "\r\n";
    socket.send(reply);
    socket.send("\002StreamTitle='Gurus of Peace  ';");
    posix.open( process.ARGV[2], process.O_RDONLY, 0666 ).addCallback( function(fd) {
        var pos = 0;
        function send() {
            posix.read( fd, 16*1024, pos, "binary" ).addCallback( function( data, n ) {
                if(!data) {
                }
                pos += n;
                socket.send( data );
                if( pos % 16384 == 0 ) {
                    //pos -= socket.send("\002StreamTitle='Gurus of Peace  ';");
                    pos -= socket.send("\000");
                    }
                if( data )
                    send();
            });
        }
        send();
    });
  });
  socket.addListener("eof", function () {
    socket.close();
  });
});
server.listen( 7000, "localhost" );
