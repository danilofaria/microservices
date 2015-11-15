exports.microserviceUrl = process.env._URL || '192.168.59.103';
exports.microservicePort = process.env._URL || 8080;
exports.queueUrl = process.env.SOURCE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/575910043716/test';