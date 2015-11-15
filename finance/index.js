// some code from: http://www.bennadel.com/blog/2792-shedding-the-monolithic-application-with-aws-simple-queue-service-sqs-and-node-js.htm
console.log(process.env);

var Promise = require("bluebird"),
    AWS = require('aws-sdk'),
    chalk = require( "chalk" );

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

// sqs.sendMessageAsync({
//     MessageBody: "{'replyTo': 'popo', 'payload': 'pipi', 'route': 'bunda', 'method': 'GET'}",
//     MessageAttributes: {
//     	replyTo: {
//     		DataType: 'String',
//     		StringValue: 'popo'
//     	},
//     	route: {
//     		DataType: 'String',
//     		StringValue: 'pipi'
//     	},
//     	method: {
//     		DataType: 'String',
//     		StringValue: 'pipi'
//     	}
//     }
// })
// .then(function(data){
// 	console.log('all good');
// 	console.log(data);
// })
// .catch(function(err){
// 	console.log('no');
// 	console.log(err);
// });


(function pollQueueForMessages() {

	console.log( chalk.yellow( "Starting long-poll operation." ) );

	sqs.receiveMessageAsync({
		WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
		VisibilityTimeout: 10,
		MessageAttributeNames: ['All']
	})
	.then(
		function handleMessageResolve( data ) {
			if ( ! data.Messages ) {
				throw(
					workflowError(
						"EmptyQueue",
						new Error( "There are no messages to process." )
					)
				);
			}


			console.log(data);
			// ---
			// TODO: Actually process the message in some way :P
			// ---

			console.log( chalk.green( "Deleting:", data.Messages[ 0 ].MessageId ) );
			console.log( chalk.green( "MessageAttributes:", JSON.stringify(data.Messages[ 0 ].MessageAttributes )) );

			// return(
			// 	sqs.deleteMessageAsync({
			// 		ReceiptHandle: data.Messages[ 0 ].ReceiptHandle
			// 	})
			// );
		return 'popo';

		}
	)
	.then(
		function handleDeleteResolve( data ) {

			console.log( chalk.green( "Message Deleted!" ) );

		}
	)

	// Catch any error (or rejection) that took place during processing.
	.catch(
		function handleError( error ) {

			switch ( error.type ) {
				case "EmptyQueue":
					console.log( chalk.cyan( "Expected Error:", error.message ) );
				break;
				default:
					console.log( chalk.red( "Unexpected Error:", error.message ) );
				break;
			}

		}
	)

	.finally( pollQueueForMessages );

})();

function workflowError( type, error ) {

	error.type = type;

	return( error );

}