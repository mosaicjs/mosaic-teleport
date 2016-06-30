var teleport = require('../teleport');

/**
 * This function returns a handler which can be used as a HTTP handler in
 * express applications.
 */
function getServerHandler(basePath, adapter) {
    basePath = basePath || '/';
    if (basePath.length > 0 && basePath[basePath.length - 1] === '/') {
        basePath = basePath.substring(0, basePath.length - 2);
    }
    return function(req, res, next) {
        return teleport.Promise.resolve().then(function() {
            var params = req.params = req.params || {};
            var path = params.path || params['0'] || '';
            if (path[0] !== '/') {
                path = '/' + path;
            }
            path = basePath + path;
            var query = req.query || {};
            var headers = req.headers || {};
            var data = req.data || {};
            var overrideKey = 'X-HTTP-Method-Override';
            var method = //
            headers[overrideKey] || query[overrideKey] || //
            req.method || 'get';
            delete query[overrideKey];
            method = method.toLowerCase();
            var options = {
                path : path,
                method : method,
                params : params,
                query : query,
                headers : headers,
                data : data
            };
            return adapter.handle(options);
        }).then(function(result) {
            result = result || {};
            var headers = result.headers || {};
            res.set(headers);
            res.send(result.data || {});
        }, function(err) {
            res.status(500).send({
                error : err.stack,
                params : req.params
            });
        });
    }
}

module.exports = getServerHandler;
