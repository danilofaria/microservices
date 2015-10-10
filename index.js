var httpProxy = require('http-proxy')
var _ = require('lodash');

var DEFAULT_PORT = 8000;
var PORT = process.env.PORT || DEFAULT_PORT;

var proxy = httpProxy.createProxy();

var routes = {
    'http://192.168.59.103:8081': /students\/[a-hA-H]/i,
    'http://192.168.59.103:8082': /students\/[i-qI-Q]/i,
    'http://192.168.59.103:8083': /students\/[r-zR-Z]/i,
    'http://192.168.59.103:8084': /courses/i
}


require('http').createServer(function (req, res) {
    var request_url = req.url,
        routing_url = _.findKey(routes, function (regEx) {
            return regEx.test(request_url);
        });

    proxy.web(req, res, {
        target: routing_url
    });
}).listen(PORT);