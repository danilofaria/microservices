console.log('Hi!');
// Constants
var DEFAULT_PORT = 8080;
var PORT = process.env.PORT || DEFAULT_PORT;

var MONGO_DEFAULT_PORT = 27017;
var MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || MONGO_DEFAULT_PORT;
var MONGO_DEFAULT_IP = '192.168.59.103';
var MONGO_IP = process.env.MONGO_PORT_27017_TCP_ADDR || MONGO_DEFAULT_IP;

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

var mongoose = require('mongoose');
var mongo_address = 'mongodb://' + MONGO_IP + ':' + MONGO_PORT + '/test';
mongoose.connect(mongo_address);

var Student = require('./models/student.js');
var StudentData = require('./models/student_data.js');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + mongo_address));
db.once('open', function (callback) {
    console.log('succesfully connected to mongodb');
});

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

var allStudentCols = function () {
    return StudentData.find().exec();
};

app.get('/test', function (req, res) {
    console.log('Hello');
    res.send('Hello');
});

app.get('/students', function (req, res) {
    Student.find(function (err, students) {
        if (err) return res.status(500).send('Error occurred: database error.');
        allStudentCols().then(function (cols) {
            res.json(students.map(function (s) {
                var student = {
                    name: s.name,
                    uni: s.uni,
                    lastName: s.lastName
                };
                cols.forEach(function (col) {
                    student[col.name] = s[col.name] || null;
                });
                return student;
            }));
        });
    });
    console.log('all students');
});

app.get('/students/:uni', function (req, res) {
    Student.findOne({'uni': req.params.uni}, function (err, s) {
        if (err) return res.status(500).send('Error occurred: database error.');
        if (!s)
            return res.status(404).send('Student not found');
        console.log(s);
        res.json({
            name: s.name,
            uni: s.uni,
            lastName: s.lastName
        });
    });
    console.log('students' + req.params.uni);
});

app.post('/students', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    if (!req.body.uni || !req.body.name || !req.body.lastName)
        return res.status(400).send('New student needs at least uni, name and lastName');
    var s = new Student({
        uni: req.body.uni,
        name: req.body.name,
        lastName: req.body.lastName
    });

    s.save(function (err, s) {
        if (err) return res.status(500).send('Error occurred: database error.');
        res.json({id: s._id});
    });

    CHANNEL.publish(EXCHANGE, 'students.new', new Buffer(JSON.stringify({uni: req.body.uni})));
});

app.put('/students/:uni', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    Student.findOne({'uni': req.params.uni}, function (err, s) {
        if (err) return res.status(500).send('Error occurred: database error.');
        if (!s)
            return res.status(404).send('Student not found');
        if (req.body.name)
            s.name = req.body.name;
        if (req.body.lastName)
            s.name = req.body.lastName;
        s.save();
        res.json({
            name: s.name,
            uni: s.uni,
            lastName: s.lastName
        });
    });
});

// todo: return 404 if non existing uni
app.delete('/students/:uni', function (req, res) {
    Student.findOneAndRemove({'uni': req.params.uni}, function (err, s) {
        if (err) return res.status(500).send('Error occurred: database error.');
        res.json({id: s._id});
    });
    CHANNEL.publish(EXCHANGE, 'students.delete', new Buffer(JSON.stringify({uni: req.params.uni})));
});


app.get('/student_schema', function (req, res) {
    allStudentCols()
        .then(function (cols) {
            var colDefs = cols.map(function (c) {
                return {
                    name: c.name,
                    type: c.type
                }
            });
            res.json(colDefs);
        }, function (err) {
            res.status(500).send('Error occurred: database error. ' + err.toString());
        });
    console.log('all columns');
});

app.post('/student_schema', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    if (!req.body.name)
        return res.status(400).send('New columd definition needs at least a name');
    var name = req.body.name,
        type = req.body.type || 'String';
    var s = new StudentData({
        name: name,
        type: type
    });
    s.save(function (err, s) {
        if (err) return res.status(500).send('Error occurred: database error.');
        res.json({id: s._id});
    });
});


var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});