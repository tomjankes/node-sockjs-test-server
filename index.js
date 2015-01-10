var http   = require('http'),
    sockjs = require('sockjs');

var echoServer = sockjs.createServer({
    sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js'
});

echoServer.on('connection', function(conn) {
    console.log('new connection ' + conn);
    conn.on('close', function() {
        console.log('closed connection ' + conn);
    });
    conn.on('data', function(message) {
        console.log('message' + conn, message);
		conn.write('Thank you for ' + message);
    });
});

var server = http.createServer();
echoServer.installHandlers(server, {prefix: '/echo'});
server.listen(9999, '0.0.0.0');
