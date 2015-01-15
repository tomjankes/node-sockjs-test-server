var Route = require('route-parser'),
    Url   = require('url');

var routes = {};


var addRoute =  function (method, path, callback) {
    if (!routes[method]) {
        routes[method] = [];
    }
    routes[method].push({path: new Route(path), callback: callback});
};

var handler = function (req, res) {
    if (routes[req.method]) {
        var routesRev = routes[req.method].reverse(),
            path = Url.parse(req.url).path;

        for (var i = 0; i < routesRev.length; i++) {
            var singleRoute = routesRev[i],
                match = singleRoute.path.match(path);

            if (match) {
                req.pathParams = match;
                singleRoute.callback(req, res);
                return;
            }
        }
    }
};

module.exports = {
    route: function (method, path, callback) {
        addRoute(method, path, callback);
    },
    get: function (path, callback) {
        addRoute('GET', path, callback);
    },
    post: function (path, callback) {
        addRoute('POST', path, callback);
    },
    options: function (path, callback) {
        addRoute('OPTIONS', path, callback);
    },
    del: function (path, callback) {
        addRoute('DELETE', path, callback);
    },
    put: function (path, callback) {
        addRoute('PUT', path, callback);
    },
    head: function (path, callback) {
        addRoute('HEAD', path, callback);
    },
    trace: function (path, callback) {
        addRoute('TRACE', path, callback);
    },
    connect: function (path, callback) {
        addRoute('CONNECT', path, callback);
    },
    patch: function (path, callback) {
        addRoute('PATCH', path, callback);
    },
    installHandlers: function (http) {
        http.on('request', function (req, res) {
            handler(req, res);
        });
    }
};