var PORT = 8070,
    DYNAMO_DB_DEFAULT_IP = "localhost",
    DYNAMO_DB_IP = process.env.DYNAMO_DB_IP || DYNAMO_DB_DEFAULT_IP,
    DYNAMO_DB_DEFAULT_PORT = "8000",
    DYNAMO_DB_PORT = process.env.DYNAMO_DB_PORT || DYNAMO_DB_DEFAULT_PORT,
    dynamodb_address = 'http://' + DYNAMO_DB_IP + ':' + DYNAMO_DB_PORT;
// java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

var AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-west-2',
    endpoint: dynamodb_address
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "Movies",
    KeySchema: [
        { AttributeName: "year", KeyType: "HASH"},
        { AttributeName: "title", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
        { AttributeName: "year", AttributeType: "N" },
        { AttributeName: "title", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});