var Promise = require("bluebird"),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    config = require('./config/config.js');

mongoose.connect(config.mongoAddress);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + config.mongoAddress));
db.once('open', function (callback) {
    console.log('succesfully connected to mongodb');
});

var DAO = require('./dao/dao.js'),
    ExtraColumns = Promise.promisifyAll(require('./models/column.js')),
    ExtraColumnsDAO = DAO(ExtraColumns, ['name', 'tenantId']),
    Student = Promise.promisifyAll(require('./models/student.js')),
    StudentDAO = DAO(Student, ['uni', 'tenantId']);

var columnGetter = function (tenantId) {
    return ExtraColumnsDAO.getAllWithParams.bind(ExtraColumnsDAO, {tenantId: tenantId});
};

var studentDAOFactory = function (tenantId) {
    return DAO(Student, ['uni', 'tenantId'], columnGetter(tenantId));
};

StudentDAO.getAll()
    .then(function (r) {
        console.log('got all students');
        console.log(r);
    })
    .then(ExtraColumnsDAO.getAll.bind(ExtraColumnsDAO))
    .then(function (r) {
        console.log('got all columns');
        console.log(r);
    })
    .then(ExtraColumnsDAO.create.bind(ExtraColumnsDAO, {name: 'popocolumn', tenantId: '1'}))
    .then(function (r) {
        console.log('create column');
        console.log(r);
    })
    .then(StudentDAO.create.bind(studentDAOFactory('1'), {
        name: 'popoto',
        uni: 'someuni',
        pomba: 'pomba',
        lastName: 'boomboom',
        socialSecurityNumber: 'poponumber',
        tenantId: '1'
    }))
    .then(function (r) {
        console.log('create student');
        console.log(r);
    })
    .then(StudentDAO.getAllWithParams.bind(studentDAOFactory('1'), {tenantId: '1'}))
    .then(function (r) {
        console.log('got all with tenant');
        console.log(r);
    })
    .then(StudentDAO.update.bind(studentDAOFactory('1'), {uni: 'someuni', tenantId: '1'}, {popocolumn: 'popocolumnvalue', nonsense: 'nonsense'}))
    .then(function (r) {
        console.log('updated student');
        console.log(r);
    })
    .then(StudentDAO.get.bind(studentDAOFactory('1'), {uni: 'someuni', tenantId: '1'}))
    .then(function (r) {
        console.log('got student');
        console.log(r);
    })
    .then(StudentDAO.destroy.bind(studentDAOFactory('1'), {uni: 'someuni', tenantId: '1'}))
    .then(function (r) {
        console.log('destroyed student');
        console.log(r);
    })
    .then(ExtraColumnsDAO.destroy.bind(ExtraColumnsDAO, {name: 'popocolumn', tenantId: '1'}))
    .then(function (r) {
        console.log('destroyed column');
        console.log(r);
    })
    .then(StudentDAO.get.bind(studentDAOFactory('1'), {uni: 'someuni', tenantId: '1'}))
    .catch(function (err) {
        console.log('deu merda');
        console.log(err);
    });
