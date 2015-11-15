exports.microserviceIP = process.env.IP || '192.168.59.103';
exports.microservicePort = process.env.PORT || 8081;
exports.queueUrl = process.env.SOURCE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/575910043716/test';