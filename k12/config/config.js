var PORT = 8070,
    DYNAMO_DB_LOCAL = 'http://localhost:8000',
    LOCAL = process.env || false,
    AWS_CONFIG = {region: 'us-west-2'};
    // java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
    if (LOCAL) {
        AWS_CONFIG.endpoint = DYNAMO_DB_LOCAL;
    }

exports.AWS_CONFIG = AWS_CONFIG;