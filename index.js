var httpProxy = require('http-proxy');
var request = require('request');
var _ = require('lodash');
var Promise = require("bluebird");

var DEFAULT_PORT = 8000;
var PORT = process.env.PORT || DEFAULT_PORT;

var proxy = httpProxy.createProxy();

var students = ['http://192.168.59.103:8081/students', 'http://192.168.59.103:8082/students'
    //, 'http://192.168.59.103:8083'
];

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

var getAllStudents = function (url) {
    var resolver = Promise.pending();
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            resolver.resolve(body);
        } else {
            resolver.reject(error);
        }
    });
    return resolver.promise;
};

var postStudent = function (url, student) {
    var resolver = Promise.pending();
    request.post({
        headers: {'content-type': 'application/json'},
        url: url,
        body: JSON.stringify(student)
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            resolver.resolve(body);
        } else {
            resolver.reject(error);
        }
    });
    return resolver.promise;
};

var getJson = function (req) {
    var resolver = Promise.pending();
    var data = '';
    req.on('data', function (chunk) {
        data += chunk;
    }).on('end', function () {
        var json = JSON.parse(data);
        resolver.resolve(json);
    });
    return resolver.promise;
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
                getJson(req).then(function (student) {
                    var uni = student.uni;
                    request_url = 'students/' + uni;
                    routing_url = findRoutingUrl(request_url);
                    return postStudent(routing_url + '/students', student);
                }).then(function (body) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    return res.end(JSON.stringify(body));
                }).catch(function (error) {
                    res.writeHead(400, {'Content-Type': 'text/plain'});
                    return res.end('Problem posting');
                });
            } else if (req.method == 'GET') {
                var promises = _.map(students, getAllStudents);
                Promise.all(promises)
                    .then(function (allStudentArrays) {
                        var allStudents = _.reduce(allStudentArrays, function (t, n) {
                            return t.concat(n);
                        });
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        return res.end(JSON.stringify(allStudents));
                    })
                    .catch(function (error) {
                        res.writeHead(400, {'Content-Type': 'text/plain'});
                        return res.end('Problem fetching all students');
                    });
            }
        }
    }
}).listen(PORT);




