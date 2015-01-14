var sockjs = require('sockjs');

module.exports = function (serverState) {
    var sockJsServer = sockjs.createServer({
        sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js'
    });

    sockJsServer.on('connection', function (conn) {
        console.log(serverState);
        serverState.connectionsMap[conn.id] = conn;
        console.log('SOCK new connection ' + conn);
        conn.on('close', function () {
            console.log('SOCK closed connection ' + conn);
            delete serverState.connectionsMap[conn.id];
        });
        conn.on('data', function (message) {
            console.log('SOCK message received ' + conn, message);
            serverState.storedMessages.push(message);
            var jsonMsg;
            try {
                jsonMsg = JSON.parse(message)
            } catch (err) {
                console.log('Cannot parse JSON: "' + message + '". Error: "' + err.message + '"');
            }
            if (jsonMsg) {
                switch(jsonMsg.type) {
                    case "ping":
                        conn.write('{"type": "ping"}');
                        break;
                    case "register":
                        if (serverState.registeredVertxListeners[jsonMsg.address] instanceof Array) {
                            serverState.registeredVertxListeners[jsonMsg.address].push(conn.id);
                        } else {
                            serverState.registeredVertxListeners[jsonMsg.address] = [conn.id];
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

    return sockJsServer;
};