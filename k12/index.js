var Promise = require('bluebird'),
    config = require('./config/config.js'),
    dao = require('./dao/dao.js'),
    Student = require('./models/student.js'),
    vogels = Promise.promisifyAll(require('vogels')),
    express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    app = express();

vogels.AWS.config.update(config.AWS_CONFIG);

var StudentModel = Promise.promisifyAll(vogels.define('Student', Student.model)),
    studentDAO = dao(StudentModel, 'socialSecurityNumber');

vogels.createTablesAsync({
        'Student': {readCapacity: 10, writeCapacity: 10}
    })
    .then(function (r) {
        console.log('created table');
        console.log(r);
    })
    .catch(function (err) {
        console.error('error creating table');
        console.error(err);
    });

var requestHandlerFactory = function (responseMaker) {
    return function (req, res) {
        responseMaker(req)
            .then(function (r) {
                res.json(r);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
};

app.route('/students')
    .get(requestHandlerFactory(studentDAO.getAll.bind(studentDAO)))
    .post(jsonParser, requestHandlerFactory(function (req) {
        return studentDAO.create(req.body);
    }));

app.route('/students/:socialSecurityNumber')
    .get(requestHandlerFactory(function (req) {
        return studentDAO.get(req.params.socialSecurityNumber);
    }))
    .delete(requestHandlerFactory(function (req) {
        return studentDAO.destroy(req.params.socialSecurityNumber);
    }))
    .put(jsonParser, requestHandlerFactory(function (req) {
        return studentDAO.update(req.params.socialSecurityNumber, req.body);
    }));

var server = app.listen(config.port, function () {
    var host = server.address().address,
        port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});