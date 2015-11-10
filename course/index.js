var DEFAULT_PORT = 8090;
var PORT = process.env.PORT || DEFAULT_PORT;

var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({extended: false})
var app = express();
app.use(require('body-parser').urlencoded({extended: true}));

var CourseDAO = require('./dao/course_dao.js');

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/courses', function (req, res) {
    CourseDAO.allCourses()
        .then(function (courses) {
            res.json(courses);
        }).catch(function (err) {
        res.status(err.code).send(err.message);
    });
    console.log('all courses');
});

app.post('/courses', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    CourseDAO.createCourse(req.body)
        .then(function (c) {
            res.json(c);
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
});

app.get('/courses/:code', function (req, res) {
    CourseDAO.getCourseByCode(req.params.code)
        .then(function (c) {
            res.json(c);
        })
        .catch(function (err) {
            res.status(err.code).send(err.message);
        });
    console.log('course' + req.params.code);
});

app.post('/courses/:code/students', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    CourseDAO.addStudentToCourse(req.params.code, req.body.uni)
        .then(function (r) {
            res.json(r);
        }).catch(function (err) {
        res.status(err.code).send(err.message);
    });
});

app.get('/courses/:code/students', function (req, res) {
    CourseDAO.getStudentsInCourse(req.params.code)
        .then(function (ss) {
            res.json(ss);
        }).catch(function (err) {
        res.status(err.code).send(err.message);
    });
    console.log('course' + req.params.code);
});


app.delete('/courses/:code/students', jsonParser, function (req, res) {
    console.log('received data ' + JSON.stringify(req.body));
    CourseDAO.deleteStudentFromCourse(req.params.code, req.body.uni)
        .then(function (r) {
            res.json(r);
        }).catch(function (err) {
        res.status(err.code).send(err.message);
    });
});

app.delete('/courses/killStudent/:uni', jsonParser, function (req, res) {
    var uni = req.params.uni;
    console.log('received data ' + JSON.stringify(req.body));
    CourseDAO.deleteStudentFromAllCourses(uni)
        .then(function (r) {
            res.json(r);
        }).catch(function (err) {
        res.status(err.code).send(err.message);
    });
});

var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});