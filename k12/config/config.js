var DYNAMO_DB_LOCAL = 'http://localhost:8000',
    LOCAL = process.env.LOCAL || false,
    AWS_CONFIG = {region: 'us-west-2'},
    DEFAULT_PORT = 8080,
    PORT = process.env.PORT || DEFAULT_PORT;
    // java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
    if (LOCAL) {
        AWS_CONFIG.endpoint = DYNAMO_DB_LOCAL;
    }

exports.AWS_CONFIG = AWS_CONFIG;
exports.port = PORT;