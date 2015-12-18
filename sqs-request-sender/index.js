var Promise = require("bluebird"),
    AWS = require('aws-sdk'),
    _ = require('lodash'),
    chalk = require('chalk'),
    uuid = require('node-uuid'),
    sleep = require('sleep');

var sqsRequestSender = function sqsRequestSender(sqs, replyTo) {
    this.sqs = sqs;
    this.replyTo = replyTo;
    this.resolversMap = {};
};

sqsRequestSender.prototype.sendRequest = function (queue, method, route, body) {
    var corrId = uuid.v1();
    this.sqs.sendMessageAsync({
        QueueUrl: queue,
        MessageBody: body,
        MessageAttributes: {
            replyTo: {
                DataType: 'String',
                StringValue: this.replyTo
            },
            corrId: {
                DataType: 'String',
                StringValue: corrId
            },
            route: {
                DataType: 'String',
                StringValue: route
            },
            method: {
                DataType: 'String',
                StringValue: method
            }
        }
    });
    var resolver = Promise.pending();
    this.resolversMap[corrId] = resolver;
    return resolver.promise.then(function (r) {
        console.log(chalk.green(method + ' ' + route));
        return r;
    });
};

sqsRequestSender.prototype.pollQueueForMessages = function pollQueueForMessages() {
    console.log(chalk.yellow("Starting long-poll operation."));
    var _this = this;
    this.pollOnce()
        .finally(this.pollQueueForMessages.bind(_this));
};

sqsRequestSender.prototype.pollOnce = function () {
    var _this = this;
    return this.sqs.receiveMessageAsync({
            WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
            VisibilityTimeout: 10,
            MessageAttributeNames: ['All']
        })
        .then(
            function handleMessageResolve(data) {
                if (!data.Messages) {
                    throw(
                        workflowError(
                            "EmptyQueue",
                            new Error("There are no messages to process.")
                        )
                    );
                }

                console.log(data);

                // Process message
                var message = data.Messages[0],
                    body = message.Body,
                    attributes = _.mapValues(message.MessageAttributes, 'StringValue'),
                    receiptHandle = message.ReceiptHandle,
                    corrId = attributes.corrId;

                _this.receiveResponse(body, corrId);
                return receiptHandle;
            }
        )
        .then(function (receiptHandle) {
            return _this.deleteMessage(receiptHandle);
        })
        // Catch any error (or rejection) that took place during processing.
        .catch(sqsRequestSender.handleError);
};

sqsRequestSender.prototype.receiveResponse = function (body, corrId) {
    var resolver = this.resolversMap[corrId];
    if (!resolver) return;
    resolver.resolve(body);
    delete this.resolversMap[corrId];
    console.log('received response');
    //console.log(body);
};

sqsRequestSender.prototype.deleteMessage = function (receiptHandle) {
    //console.log(chalk.yellow("Deleting:", receiptHandle));
    return (
        this.sqs.deleteMessageAsync({
            ReceiptHandle: receiptHandle
        })
    )
        .then(console.log.bind(null, chalk.yellow("Message Deleted!")));
};

sqsRequestSender.handleError = function handleError(error) {
    switch (error.type) {
        case "EmptyQueue":
            console.log(chalk.cyan("Expected Error:", error.message));
            break;
        default:
            console.log(chalk.red("Unexpected Error:", error.message));
            break;
    }
};

function workflowError(type, error) {
    error.type = type;
    return ( error );
}

var module_export = function (pollingQueue) {
    // assumes environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
    var sqs = new AWS.SQS({
        region: 'us-east-1',
        params: {
            QueueUrl: pollingQueue
        }
    });
    sqs = Promise.promisifyAll(sqs);
    return new sqsRequestSender(sqs, pollingQueue);
};

module.exports = module_export;

var wrapper = function (promiser) {
    return function () {
        return promiser().then(function (response) {
                console.log(chalk.green('yay!'));
                console.log(chalk.green('response: '));
                console.log(chalk.green(response));
            })
            .catch(function (err) {
                console.log(chalk.red('something bad happened!'));
                console.log(chalk.red(err));
            })
    };
};

var sender = module_export('https://sqs.us-east-1.amazonaws.com/575910043716/p2sender'),
    receiverQueueUrlFinance = 'https://sqs.us-east-1.amazonaws.com/575910043716/p2receiver',
    receiverQueueUrlK12 = 'https://sqs.us-east-1.amazonaws.com/575910043716/p2receiverk12';
sender.pollQueueForMessages();

new Promise(function (resolve, reject) {
    console.log(chalk.green('Start finance micro-service requests'));
    sleep.sleep(3);
    resolve();
}).then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'get', 'users/1/students', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'post', 'admin/users/1/students', '{"name": "Robert","lastName": "Wall","balance": 10,"socialSecurityNumber": "sddsds","uni": "rob"}')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'get', 'users/1/students/rob', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'put', 'admin/users/1/students/rob', '{"balance": 3000}')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'get', 'users/1/students/rob', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'del', 'admin/users/1/students/rob', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlFinance, 'get', 'users/1/students', 'empty')))
    .then(console.log.bind(console, chalk.green('THE END')))
    .then(console.log.bind(console, chalk.green('Start K-12 micro-service requests')))
    .then(sleep.sleep.bind(sleep, 3))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'get', 'students', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'post', 'students', '{"socialSecurityNumber": "blabla","name": "Antony","birthYear": 1992,"lastName": "Anderson"}')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'get', 'students/blabla', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'put', 'students/blabla', '{"lastName": "Kakarot"}')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'get', 'students/blabla', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'del', 'students/blabla', 'empty')))
    .then(wrapper(sender.sendRequest.bind(sender, receiverQueueUrlK12, 'get', 'students', 'empty')))
    .then(console.log.bind(console, chalk.green('THE END')));