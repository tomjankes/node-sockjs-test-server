var http   = require('http'),
    sockjs = require('sockjs'),
	fs     = require('fs');

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

var indexHandler = function (req, res) {
    console.log(req.method + " " + req.path);
    fs.readFile('index.html', 'utf8', function (err, data) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.write('Internal server error');
            res.end();
        }
        console.log('Serving index.html');
        res.writeHead(200);
        res.write(data);
        res.end();
    });
};

var server = http.createServer(indexHandler);
echoServer.installHandlers(server, {prefix: '/sockjs'});
server.listen(9999, '0.0.0.0');
