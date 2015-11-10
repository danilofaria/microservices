var request = require('request');

var RABBITMQ_DEFAULT_PORT = 5672,
    RABBITMQ_PORT = process.env.RABBITMQ_PORT_5672_TCP_PORT || RABBITMQ_DEFAULT_PORT,
    RABBITMQ_DEFAULT_IP = '192.168.59.103',
    RABBITMQ_IP = process.env.RABBITMQ_PORT_5672_TCP_ADDR || RABBITMQ_DEFAULT_IP;

var EXCHANGE = 'exchange';

var COURSE_MANAGER_DEFAULT_IP = '192.168.59.103',
    COURSE_MANAGER_DEFAULT_PORT = 8090,
    COURSE_MANAGER_PORT = process.env.COURSES_PORT_8090_TCP_PORT || COURSE_MANAGER_DEFAULT_PORT,
    COURSE_MANAGER_IP = process.env.COURSES_PORT_8090_TCP_ADDR || COURSE_MANAGER_DEFAULT_IP;

var onStudentDeleted = function (uni) {
    console.log('Student with uni=' + uni + ' was deleted');
    var url = 'http://' + COURSE_MANAGER_IP + ':' + COURSE_MANAGER_PORT + '/courses/students/' + uni;
    console.log(url);
    request.del({
        url: url
    }, function (error, response) {
        if (!error && response.statusCode === 200) {
            console.log('Request to delete student from course manager successful');
        } else {
            console.log('Error: ' + error.toString());
        }
    });
};

var onStudentAdded = function (uni) {
    console.log('Student with uni=' + uni + ' was added');
};

var open = require('amqplib').connect('amqp://' + RABBITMQ_IP);
open.then(function (conn) {
        var channelPromise = conn.createChannel();
        channelPromise = channelPromise.then(function (channel) {
            console.log('connected to RabbitMQ!');
            channel.assertExchange(EXCHANGE, 'topic', {durable: false});

            channel.assertQueue('deletedStudents', {exclusive: true})
                .then(function (q) {
                    channel.bindQueue(q.queue, EXCHANGE, 'students.delete');
                    channel.consume(q.queue, function (msg) {
                        console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());
                        var uni = JSON.parse(msg.content.toString()).uni;
                        onStudentDeleted(uni);
                    }, {noAck: true});
                });

            channel.assertQueue('newStudents', {exclusive: true})
                .then(function (q) {
                    channel.bindQueue(q.queue, EXCHANGE, 'students.new');
                    channel.consume(q.queue, function (msg) {
                        console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());
                        var uni = JSON.parse(msg.content.toString()).uni;
                        onStudentAdded(uni);
                    }, {noAck: true});
                });
        });
        return channelPromise;
    })
    .then(null, console.warn);

