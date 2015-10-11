var request = require('request');

var RABBITMQ_DEFAULT_PORT = 5672;
var RABBITMQ_PORT = process.env.RABBITMQ_PORT_5672_TCP_PORT || RABBITMQ_DEFAULT_PORT;
var RABBITMQ_DEFAULT_IP = '192.168.59.103';
var RABBITMQ_IP = process.env.RABBITMQ_PORT_5672_TCP_ADDR || RABBITMQ_DEFAULT_IP;

var EXCHANGE = 'exchange';

var open = require('amqplib').connect('amqp://' + RABBITMQ_IP);
open.then(function (conn) {
    var channelPromise = conn.createChannel();
    channelPromise = channelPromise.then(function (channel) {
        console.log('connected to RabbitMQ!');
        channel.assertExchange(EXCHANGE, 'topic', {durable: false});

        channel.assertQueue('deletedStudents', {exclusive: true})
            .then(function (q) {
                channel.bindQueue(q.queue, EXCHANGE, 'students.deleted');
                channel.consume(q.queue, function (msg) {
                    console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());
                }, {noAck: true});
            });

        channel.assertQueue('newStudents', {exclusive: true})
            .then(function (q) {
                channel.bindQueue(q.queue, EXCHANGE, 'students.new');
                channel.consume(q.queue, function (msg) {
                    console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());
                }, {noAck: true});
            });

    });
    return channelPromise;
}).then(null, console.warn);