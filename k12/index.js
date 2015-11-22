var Promise = require('bluebird'),
    _ = require('lodash'),
    config = require('./config/config.js'),
    dao = require('./dao/dao.js'),
    Student = require('./models/student.js'),
    vogels = Promise.promisifyAll(require('vogels'));

vogels.AWS.config.update(config.AWS_CONFIG);

var StudentModel = Promise.promisifyAll(vogels.define('Student', Student.model)),
    studentDAO = dao(StudentModel, 'socialSecurityNumber');

vogels.createTablesAsync({
    'Student': {readCapacity: 10, writeCapacity: 10}
}).then(function (r) {
        console.log('created table');
        console.log(r);
    })
    .then(studentDAO.create.bind(studentDAO, {socialSecurityNumber: 'mipopo', name: 'Pimpolho', birthYear: 1992, lastName: 'mipopu'}))
    .then(function (r) {
        console.log('created student');
        console.log(r);
    })
    .then(studentDAO.getAll.bind(studentDAO))
    .then(function (r) {
        console.log('all students');
        console.log(r);
    })
    .then(studentDAO.update.bind(studentDAO, 'mipopo', {name: 'Pimpolho'}))
    .then(function (r) {
        console.log('updated student');
        console.log(r);
    })
    .then(studentDAO.get.bind(studentDAO, 'mipopo'))
    .then(function (r) {
        console.log('get student');
        console.log(r);
    })
    .then(studentDAO.destroy.bind(studentDAO, 'mipopo'))
    .then(function (r) {
        console.log('deleted students');
        console.log(r);
    })
    .then(studentDAO.getAll.bind(studentDAO))
    .then(function (r) {
        console.log('all students');
        console.log(r);
    })
    .catch(function (err) {
        console.log(err);
    });

