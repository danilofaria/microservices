// some code from: http://www.bennadel.com/blog/2792-shedding-the-monolithic-application-with-aws-simple-queue-service-sqs-and-node-js.htm
var Promise = require("bluebird"),
    chalk = require('chalk'),
    config = require('./config/config.js'),
    sqsRequestHandler = require('./sqs/sqs-request-handler.js')(config.queueUrl);

console.log(process.env);
console.log(config);

sqsRequestHandler.pollQueueForMessages(function (body, attributes) {
    return new Promise(function (resolve, reject) {
        console.log('start');
        console.log(body);
        console.log(attributes);
        resolve('all good');
    });
});