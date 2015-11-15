var Promise = require("bluebird"),
    AWS = require('aws-sdk'),
    chalk = require('chalk'),
    _ = require('lodash');

var sqsRequestHandler = function sqsRequestHandler(sqs) {
    this.sqs = sqs;

    //sqs.sendMessageAsync({
    //    MessageBody: '{"name":"Albert","uni":"aljpopo","lastName":"Junior"}',
    //    MessageAttributes: {
    //        replyTo: {
    //            DataType: 'String',
    //            StringValue: 'https://sqs.us-east-1.amazonaws.com/575910043716/test2'
    //        },
    //        corrId: {
    //            DataType: 'String',
    //            StringValue: 'dsoakdposak'
    //        },
    //        route: {
    //            DataType: 'String',
    //            StringValue: 'students'
    //        },
    //        method: {
    //            DataType: 'String',
    //            StringValue: 'post'
    //        }
    //    }
    //})
};

sqsRequestHandler.prototype.sendToQueue = function (destinationQueue, body, corrId) {
    if (!destinationQueue || !body || !corrId) {
        throw(
            workflowError(
                "MissingArgument",
                new Error("Please provide reply to queue, response body and correlation id")
            )
        );
    }
    return this.sqs.sendMessageAsync({
        MessageBody: body,
        QueueUrl: destinationQueue,
        MessageAttributes: {
            corrId: {
                DataType: 'String',
                StringValue: corrId
            }
        }
    });
};

sqsRequestHandler.prototype.pollOnce = function (messageProcessor) {
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

                // ---
                // Process message
                // ---
                var message = data.Messages[0],
                    body = message.Body,
                    attributes = _.mapValues(message.MessageAttributes, 'StringValue'),
                    receiptHandle = message.ReceiptHandle,
                    replyTo = attributes.replyTo,
                    corrId = attributes.corrId;

                return messageProcessor(body, attributes)
                    .then(function (response) {
                        return _this.sendToQueue(replyTo, response, corrId);
                    }).then(function(){
                        return receiptHandle;
                    });
            }
        )
        .then(function(receiptHandle){
            console.log(chalk.green("Deleting:", receiptHandle));
            return(
             	_this.sqs.deleteMessageAsync({
             		ReceiptHandle: receiptHandle
             	})
             );
        })
        .then(
            function handleDeleteResolve(data) {

                console.log(chalk.green("Message Deleted!"));

            }
        )
        // Catch any error (or rejection) that took place during processing.
        .catch(
            function handleError(error) {

                switch (error.type) {
                    case "EmptyQueue":
                        console.log(chalk.cyan("Expected Error:", error.message));
                        break;
                    default:
                        console.log(chalk.red("Unexpected Error:", error.message));
                        break;
                }

            }
        );
};

sqsRequestHandler.prototype.pollQueueForMessages = function pollQueueForMessages(messageProcessor) {
    console.log(chalk.yellow("Starting long-poll operation."));
    var _this = this;
    this.pollOnce(messageProcessor)
        .finally(this.pollQueueForMessages.bind(_this, messageProcessor));
};

function workflowError(type, error) {
    error.type = type;
    return ( error );
}

module.exports = function (pollingQueue) {
    // assumes environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
    var sqs = new AWS.SQS({
        region: 'us-east-1',
        params: {
            QueueUrl: pollingQueue
        }
    });
    sqs = Promise.promisifyAll(sqs);
    return new sqsRequestHandler(sqs);
};
