var router = require('./router');

module.exports = function (serverState) {
    router.get('/stored_messages', function (req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(serverState.storedMessages));
    });

    router.del('/stored_messages', function (req, res) {
        serverState.storedMessages = [];
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(serverState.storedMessages);
    });

    router.get('/current_connections', function (req, res) {
        var connectionIds = [];
        for (var connectionId in serverState.connectionsMap) {
            if (serverState.connectionsMap.hasOwnProperty(connectionId)) {
                connectionIds.push(connectionId);
            }
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(connectionIds));
    });

    router.del('/current_connections/:connId', function (req, res) {
        var connection = serverState.connectionsMap[req.pathParams.connId];
        if (connection) {
            connection.close();
            res.writeHead(204);
            res.end();
            return;
        }
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: "Connection " + req.pathParams.connId + " not found"}));
    });

    router.post('/new_messages/:connId', function (req, res) {
        var connection = serverState.connectionsMap[req.pathParams.connId];
        if (connection) {
            connection.write(req.body.message);
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({connection: connection.id, message: req.body}));
            return;
        }
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: "Connection " + req.pathParams.connId + " not found"}));
    });


    router.get('/registered_vertx_handlers', function (req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(serverState.registeredVertxListeners));
    });

    router.post('/new_vertxbus_messages', function (req, res) {
        var topic = req.body.topic;
        if (topic) {
            var listeners = serverState.registeredVertxListeners[topic];
            if (listeners instanceof Array) {
                for (var i = 0; i < listeners.length; i++) {
                    var listener = listeners[i],
                        conn = serverState.connectionsMap[listener];
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

    return router;
};