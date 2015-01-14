var http = require('http'),
    demoPageHandler = require('./lib/demo-page-handler'),
    restHandler = require('./lib/server-introspection-handler'),
    serverState = require('./lib/server-state'),
    sockJsHandler = require('./lib/sockjs-handler');

var server = http.createServer();

demoPageHandler.installHandlers(server);
restHandler(serverState).installHandlers(server);
sockJsHandler(serverState).installHandlers(server, {prefix: '/sockjs'});

server.listen(9999, '0.0.0.0');


