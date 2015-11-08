var Promise = require("bluebird"),
    mongoose = require('mongoose');

var MONGO_DEFAULT_PORT = 27017,
    MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || MONGO_DEFAULT_PORT,
    MONGO_DEFAULT_IP = '192.168.59.103',
    MONGO_IP = process.env.MONGO_PORT_27017_TCP_ADDR || MONGO_DEFAULT_IP,
    mongo_address = 'mongodb://' + MONGO_IP + ':' + MONGO_PORT + '/test',
    DB_ERROR = 'Error occurred: database error.';

var Student = require('./../models/student.js'),
    StudentData = require('./../models/student_data.js');

mongoose.connect(mongo_address);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + mongo_address));
db.once('open', function (callback) {
    console.log('succesfully connected to mongodb');
});

var allStudentCols = function () {
    return StudentData.find().exec();
};

var allStudents = function () {
    var resolver = Promise.pending();
    Student.find(function (err, students) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        allStudentCols().then(function (cols) {
            resolver.resolve(students.map(function (s) {
                var student = {
                    name: s.name,
                    uni: s.uni,
                    lastName: s.lastName
                };
                cols.forEach(function (col) {
                    student[col.name] = s.get(col.name) || null;
                });
                return student;
            }));
        });
    });
    return resolver.promise;
};

var getStudentByUni = function (uni) {
    var resolver = Promise.pending();
    Student.findOne({'uni': uni}, function (err, s) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        if (!s) return resolver.reject({message: 'Student not found', code: 404});
        console.log(s);
        var student = {
            name: s.name,
            uni: s.uni,
            lastName: s.lastName
        };
        allStudentCols().then(function (cols) {
            cols.forEach(function (col) {
                student[col.name] = s.get(col.name) || null;
            });
            resolver.resolve(student);
        });
    });
    return resolver.promise;
};

var createStudent = function (body) {
    var resolver = Promise.pending();

    if (!body.uni || !body.name || !body.lastName)
        return resolver.reject({message: 'New student needs at least uni, name and lastName', code: 400});

    var student = {
        uni: body.uni,
        name: body.name,
        lastName: body.lastName
    };

    allStudentCols().then(function (cols) {
        cols.forEach(function (col) {
            student[col.name] = body[col.name] || null;
        });
        var s = new Student(student);
        s.save(function (err, s) {
            if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
            resolver.resolve({id: s._id});
        });
    });

    return resolver.promise;
};

var updateStudent = function (uni, body) {
    var resolver = Promise.pending();

    var update = {};
    if (body.name)
        update.name = body.name;
    if (body.lastName)
        update.lastName = body.lastName;
    allStudentCols().then(function (cols) {
        cols.forEach(function (col) {
            if (body[col.name])
                update[col.name] = body[col.name];
        });
        Student.findOneAndUpdate({'uni': uni}, update, function (err, s) {
            if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
            if (!s) return resolver.reject({message: 'Student not found', code: 404});
            resolver.resolve(
                {updated: update}
            );
        });
    });

    return resolver.promise;
};


var deleteStudent = function (uni){
    var resolver = Promise.pending();

    Student.findOneAndRemove({'uni': uni}, function (err, s) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        if (!s) return resolver.reject({message: 'Student not found', code: 404});
        resolver.resolve({id: s._id});
    });

    return resolver.promise;
};


var allStudentColDefs = function() {
    var resolver = Promise.pending();
    allStudentCols()
        .then(function (cols) {
            var colDefs = cols.map(function (c) {
                return {
                    name: c.name,
                    type: c.type
                }
            });
            resolver.resolve(colDefs);
        }, function (err) {
            resolver.reject({error: err, message: DB_ERROR, code: 500});
        });
    return resolver.promise;
};

var addStudentCol = function(body) {
    var resolver = Promise.pending();
    if (!body.name) return resolver.reject({message: 'New colum definition needs at least a name', code: 400});
    var name = body.name,
        type = body.type || 'String';
    var s = new StudentData({
        name: name,
        type: type
    });
    s.save(function (err, s) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        resolver.resolve({id: s._id});
    });
    return resolver.promise;
};

exports.allStudents = allStudents;
exports.getStudentByUni = getStudentByUni;
exports.createStudent = createStudent;
exports.deleteStudent = deleteStudent;
exports.allStudentColDefs = allStudentColDefs;
exports.addStudentCol = addStudentCol;