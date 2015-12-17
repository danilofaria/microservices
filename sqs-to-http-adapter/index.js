// some code from: http://www.bennadel.com/blog/2792-shedding-the-monolithic-application-with-aws-simple-queue-service-sqs-and-node-js.htm
var Promise = require("bluebird"),
    chalk = require('chalk'),
    config = require('./config/config.js'),
    sqsRequestHandler = require('./sqs/sqs-request-handler.js')(config.queueUrl);

console.log(process.env);
console.log(config);

var request = require('request');
var handle = function (body, attributes) {
    var method = attributes.method,
        route = attributes.route,
        url = 'http://' + config.microserviceIP + ':' + config.microservicePort + '/' + route;

    return new Promise(function (resolve, reject) {
        var params = {
            url: url,
            body: body
        };
        if (method == 'post' || method == 'put')
            params.headers = {'content-type': 'application/json'};
        if (method == 'get')
            params.json = true;
        request[method](params, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(JSON.stringify(body));
            } else {
                resolve(JSON.stringify({type: 'RequestError', error: error, message: body, code: response.statusCode}));
            }
        });
    });
};

sqsRequestHandler.pollQueueForMessages(handle);

