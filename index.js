var DEFAULT_PORT = 8090;
var PORT = process.env.PORT || DEFAULT_PORT;
var MONGO_DEFAULT_PORT = 27017;
var MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || MONGO_DEFAULT_PORT;
var MONGO_DEFAULT_IP = '192.168.59.103';
var MONGO_IP = process.env.MONGO_PORT_27017_TCP_ADDR || MONGO_DEFAULT_IP;

var _ = require('lodash');
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

var Course = require('./models/course.js');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + mongo_address));
db.once('open', function (callback) {
    console.log('succesfully connected to mongodb');
});


app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/courses', function (req, res) {
    Course.find(function (err, courses) {
        if (err) return res.status(500).send('Error occurred: database error.');
        res.json(courses.map(function (c) {
            return {
                title: c.title,
                code: c.code,
                students: _.map(c.students, function (s) {
                    return {'uni': s.uni};
                })
            }
        }));
    });
    console.log('all courses');
});

app.post('/courses', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    if (!req.body.code || !req.body.title)
        return res.status(400).send('New courses needs at least code and title');
    var c = new Course({
        code: req.body.code,
        title: req.body.title,
        students: []
    });

    c.save(function (err, s) {
        if (err) return res.status(500).send('Error occurred: database error.');
        res.json({id: s._id});
    });
});

app.get('/courses/:code', function (req, res) {
    Course.findOne({'code': req.params.code}, function (err, c) {
        if (err) return res.status(500).send('Error occurred: database error.');
        if (!c)
            return res.status(404).send('Course not found');
        console.log(c);
        var course = {
            code: c.code,
            title: c.title,
            students: _.map(c.students, function (s) {
                return {'uni': s.uni};
            })
        };
        res.json(course);
    });
    console.log('course' + req.params.code);
});


app.post('/courses/:code/students', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    if (!req.body.uni)
        return res.status(400).send('Student`s uni is necessary');
    Course.findOne({'code': req.params.code}, function (err, c) {
        if (err) return res.status(500).send('Error occurred: database error.');
        if (!c)
            return res.status(404).send('Course not found');
        if (_.find(c.students, {'uni': req.body.uni}))
            return res.status(400).send('Student is already in course');
        c.students.push({"uni": req.body.uni});
        c.save();
        res.json({
            student_uni: req.body.uni,
            course_code: req.params.code
        });
    });
});

app.get('/courses/:code/students', function (req, res) {
    Course.findOne({'code': req.params.code}, function (err, c) {
        if (err) return res.status(500).send('Error occurred: database error.');
        if (!c)
            return res.status(404).send('Course not found');
        console.log(c);
        var course = {
            students: _.map(c.students, function (s) {
                return {'uni': s.uni};
            })
        };
        res.json(course);
    });
    console.log('course' + req.params.code);
});


app.delete('/courses/:code/students', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    if (!req.body.uni)
        return res.status(400).send('Student`s uni is necessary');
    Course.findOne({'code': req.params.code}, function (err, c) {
        if (err) return res.status(500).send('Error occurred: database error.');
        if (!c)
            return res.status(404).send('Course not found');
        if (!_.find(c.students, {'uni': req.body.uni}))
            return res.status(400).send('Student is not in course');
        var i = _.findIndex(c.students, {'uni': req.body.uni});
        c.students.splice(i, 1);
        c.save();
        res.json({
            student_uni: req.body.uni,
            course_code: req.params.code
        });
    });
});

app.delete('/courses/killStudent/:uni', jsonParser, function (req, res) {
    var uni = req.params.uni;
    console.log('received data ' + JSON.stringify(req.body));
    Course.find({'students.uni': uni})
        .exec(function (err, courses) {
            _.each(courses, function (c) {
                c.students.splice(
                    _.findIndex(c.students, {'uni': uni}),
                    1);
                c.save();
            });
            res.status(200).send('Student is gone');
        });
});


var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});