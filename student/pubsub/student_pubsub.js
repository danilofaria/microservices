var RABBITMQ_DEFAULT_PORT = 5672;
var RABBITMQ_PORT = process.env.RABBITMQ_PORT_5672_TCP_PORT || RABBITMQ_DEFAULT_PORT;
var RABBITMQ_DEFAULT_IP = '192.168.59.103';
var RABBITMQ_IP = process.env.RABBITMQ_PORT_5672_TCP_ADDR || RABBITMQ_DEFAULT_IP;

var EXCHANGE = 'exchange';
var CHANNEL;

var open = require('amqplib').connect('amqp://' + RABBITMQ_IP);
open.then(function (conn) {
    var channelPromise = conn.createChannel();
    channelPromise = channelPromise.then(function (channel) {
        console.log('connected to RabbitMQ!');
        channel.assertExchange(EXCHANGE, 'topic', {durable: false});
        CHANNEL = channel;
    });
    return channelPromise;
}).then(null, console.warn);


var onStudentCreated = function(uni) {
    CHANNEL.publish(EXCHANGE, 'students.new', new Buffer(JSON.stringify({uni: uni})));
};

var onStudentDeleted = function(uni) {
    CHANNEL.publish(EXCHANGE, 'students.delete', new Buffer(JSON.stringify({uni: uni})));
};

exports.onStudentCreated = onStudentCreated;
exports.onStudentDeleted = onStudentDeleted;