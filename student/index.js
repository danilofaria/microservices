console.log('Hi!');
// Constants
var DEFAULT_PORT = 8080;
var PORT = process.env.PORT || DEFAULT_PORT;

var RABBITMQ_DEFAULT_PORT = 5672;
var RABBITMQ_PORT = process.env.RABBITMQ_PORT_5672_TCP_PORT || RABBITMQ_DEFAULT_PORT;
var RABBITMQ_DEFAULT_IP = '192.168.59.103';
var RABBITMQ_IP = process.env.RABBITMQ_PORT_5672_TCP_ADDR || RABBITMQ_DEFAULT_IP;

var EXCHANGE = 'exchange';
var CHANNEL;

var express = require('express');
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({extended: false})
var app = express();
app.use(require('body-parser').urlencoded({extended: true}));

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

var StudentDAO = require('./dao/studentDAO.js');

app.get('/test', function (req, res) {
    console.log('Hello');
    res.send('Hello');
});

app.get('/students', function (req, res) {
    StudentDAO.allStudents()
        .then(function (students) {
            res.json(students);
        }).catch(function (err) {
        res.status(err.code).send(err.message);
    });
    console.log('all students');
});

app.get('/students/:uni', function (req, res) {
    StudentDAO.getStudentByUni(req.params.uni)
        .then(function (s) {
            res.json(s);
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
    console.log('students' + req.params.uni);
});

app.post('/students', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    StudentDAO.createStudent(req.body)
        .then(function (s) {
            res.json(s);
            CHANNEL.publish(EXCHANGE, 'students.new', new Buffer(JSON.stringify({uni: req.body.uni})));
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
});

app.put('/students/:uni', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    StudentDAO.updateStudent(req.params.uni, req.body)
        .then(function (r) {
            res.json(r);
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
});

app.delete('/students/:uni', function (req, res) {
    StudentDAO.deleteStudent(req.params.uni)
        .then(function (r) {
            res.json(r);
            CHANNEL.publish(EXCHANGE, 'students.delete', new Buffer(JSON.stringify({uni: req.params.uni})));
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
});


app.get('/student_schema', function (req, res) {
    StudentDAO.allStudentColDefs()
        .then(function (r) {
            res.json(r);
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
    console.log('all columns');
});

app.post('/student_schema', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    StudentDAO.addStudentCol(req.body)
        .then(function (r) {
            res.json(r);
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
});


var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});