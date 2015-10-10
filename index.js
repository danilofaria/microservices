var httpProxy = require('http-proxy');
var request = require('request');
var _ = require('lodash');

var DEFAULT_PORT = 8000;
var PORT = process.env.PORT || DEFAULT_PORT;

var proxy = httpProxy.createProxy();

var students = ['http://192.168.59.103:8081', 'http://192.168.59.103:8082', 'http://192.168.59.103:8083'];

var routes = {
    'http://192.168.59.103:8081': /students\/[a-hA-H]/i,
    'http://192.168.59.103:8082': /students\/[i-qI-Q]/i,
    'http://192.168.59.103:8083': /students\/[r-zR-Z]/i,
    'http://192.168.59.103:8084': /courses/i
}

var findRoutingUrl = function (request_url) {
    return _.findKey(routes, function (regEx) {
        return regEx.test(request_url);
    });
};

require('http').createServer(function (req, res) {
    var request_url = req.url,
        routing_url = findRoutingUrl(request_url);

    if (routing_url) {
        proxy.web(req, res, {
            target: routing_url
        });
        return;
    }
    else {
        if (request_url == '/students/' || request_url == '/students') {
            if (req.method == 'POST') {
                // Not working
                var data = '';
                req.on('data', function (chunk) {
                    data += chunk;
                }).on('end', function () {
                    var json = JSON.parse(data),
                        uni = json.uni;
                    request_url = 'students/' + uni;
                    routing_url = findRoutingUrl(request_url);
                    return proxy.web(req, res, {
                        target: routing_url
                    });
                });
                //return;
            } else if (req.method == 'GET') {
                // has to merge with other urls
                request({
                    url: students[0] + '/students',
                    json: true
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(body));
                    } else {
                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        return res.end('students');
                    }
                });
            }
        }
    }
    //res.writeHead(400, {'Content-Type': 'text/plain'});
    //return res.end('This url is not available.');
}).listen(PORT);