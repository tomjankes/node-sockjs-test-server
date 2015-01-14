var http = require('http'),
    sockjs = require('sockjs'),
    fs = require('fs'),
    router = require('node-simple-router');

var sockJsServer = sockjs.createServer({
    sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js'
});

var storedMessages = [];
var connectionsMap = {};
var registeredVertxListeners = {};

sockJsServer.on('connection', function (conn) {
    connectionsMap[conn.id] = conn;
    console.log('SOCK new connection ' + conn);
    conn.on('close', function () {
        console.log('SOCK closed connection ' + conn);
        delete connectionsMap[conn.id];
    });
    conn.on('data', function (message) {
        console.log('SOCK message received ' + conn, message);
        storedMessages.push(message);
        var jsonMsg = JSON.parse(message);
        if (jsonMsg.type) {
            switch(jsonMsg.type) {
                case "ping":
                    conn.write('{"type": "ping"}');
                    break;
                case "register":
                    if (registeredVertxListeners[jsonMsg.address] instanceof Array) {
                        registeredVertxListeners[jsonMsg.address].push(conn.id);
                    } else {
                        registeredVertxListeners[jsonMsg.address] = [conn.id];
                    }
                    conn.write('{"message": "ok"}');
                    break;
                default:
                    conn.write('{"message": "did not understand"}');
            }
        } else {
            conn.write('Thank you for ' + message);
        }
    });
});

var httpServer = router({
    serve_static: false,
    serve_php: false,
    serve_cgi: false,
    software_name: 'node-sockjs-test-server',

});
httpServer.get('/', function (req, res) {
    fs.readFile('index.html', 'utf8', function (err, data) {
        if (err) {
            console.log(err);
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.write('Internal server error');
            res.end();
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        }
    });
});

httpServer.get('/stored_messages', function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(storedMessages));
});

httpServer.delete('/stored_messages', function (req, res) {
    storedMessages = [];
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(storedMessages);
});

httpServer.get('/current_connections', function (req, res) {
    var connectionIds = [];
    for (var connectionId in connectionsMap) {
        if (connectionsMap.hasOwnProperty(connectionId)) {
            connectionIds.push(connectionId);
        }
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(connectionIds));
});

httpServer.delete('/current_connections/:connId', function (req, res) {
    var connection = connectionsMap[req.params.connId];
    if (connection) {
        connection.close();
        res.writeHead(204);
        res.end();
        return;
    }
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: "Connection " + req.params.connId + " not found"}));
});

httpServer.post('/new_messages/:connId', function (req, res) {
    var connection = connectionsMap[req.params.connId];
    if (connection) {
        connection.write(req.body.message);
        res.writeHead(201, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({connection: connection.id, message: req.body}));
        return;
    }
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: "Connection " + req.params.connId + " not found"}));
});

httpServer.post('/new_vertxbus_messages', function (req, res) {
    var topic = req.body.topic;
    if (topic) {
        var listeners = registeredVertxListeners[topic];
        if (listeners instanceof Array) {
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i],
                    conn = connectionsMap[listener];
                if (conn) {
                    conn.write(JSON.stringify({address: req.body.topic, body: req.body.body}));
                    res.writeHead(201);
                    res.end();
                    return;
                }
            }
        }
    }
    res.writeHead(404);
    res.end();
});

httpServer.get('/registered_vertx_handlers', function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(registeredVertxListeners));
});

var server = http.createServer(httpServer);
sockJsServer.installHandlers(server, {prefix: '/sockjs'});
server.listen(9999, '0.0.0.0');
