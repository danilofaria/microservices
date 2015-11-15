var Promise = require("bluebird"),
    AWS = require('aws-sdk');

var queueUrl = process.env.SOURCE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/575910043716/test',
	microserviceUrl = process.env._URL || '192.168.59.103',
	microservicePort = process.env._URL || 8080;

var sqs = new AWS.SQS({
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',

    // For every request in this demo, I'm going to be using the same QueueUrl; so,
    // rather than explicitly defining it on every request, I can set it here as the
    // default QueueUrl to be automatically appended to every request.
    params: {
        QueueUrl: queueUrl
    }
});

sqs = Promise.promisifyAll(sqs);

// sqsA.sendMessageAsync({
//     MessageBody: "data data"
// })
// .then(function(data){
// 	console.log('all good');
// 	console.log(data);
// })
// .catch(function(err){
// 	console.log('no');
// 	console.log(err);
// });

sqs.receiveMessageAsync({
        WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
        VisibilityTimeout: 10
    })
.then(function(data){
	console.log('all good');
	console.log(data);
	return(
        sqs.deleteMessageAsync({
            ReceiptHandle: data.Messages[ 0 ].ReceiptHandle
        })
    );
})
.then(function( data ) {
            console.log( "Message Deleted!" );
        })
.catch(function(err){
	console.log('no');
	console.log(err);
});