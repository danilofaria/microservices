var Promise = require("bluebird"),
    mongoose = require('mongoose'),
    _ = require('lodash');

var MONGO_DEFAULT_PORT = 27017,
    MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || MONGO_DEFAULT_PORT,
    MONGO_DEFAULT_IP = '192.168.59.103',
    MONGO_IP = process.env.MONGO_PORT_27017_TCP_ADDR || MONGO_DEFAULT_IP,
    mongo_address = 'mongodb://' + MONGO_IP + ':' + MONGO_PORT + '/test',
    DB_ERROR = 'Error occurred: database error.';

mongoose.connect(mongo_address);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + mongo_address));
db.once('open', function (callback) {
    console.log('succesfully connected to mongodb');
});

var Course = require('./../models/course.js');

var allCourses = function () {
    var resolver = Promise.pending();
    Course.find(function (err, courses) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        resolver.resolve(courses.map(function (c) {
            return {
                title: c.title,
                code: c.code,
                students: _.map(c.students, function (s) {
                    return {'uni': s.uni};
                })
            }
        }));
    });
    return resolver.promise;
};

var createCourse = function (body) {
    var resolver = Promise.pending();
    if (!body.code || !body.title)
        return resolver.reject({message: 'New courses needs at least code and title', code: 400});

    var c = new Course({
        code: body.code,
        title: body.title,
        students: []
    });

    c.save(function (err, s) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        resolver.resolve({id: s._id});
    });

    return resolver.promise;
};

var getCourseByCode = function (code) {
    var resolver = Promise.pending();
    Course.findOne({'code': code}, function (err, c) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        if (!c) return resolver.reject({message: 'Course not found', code: 404});
        console.log(c);
        var course = {
            code: c.code,
            title: c.title,
            students: _.map(c.students, function (s) {
                return {'uni': s.uni};
            })
        };
        resolver.resolve(course);
    });
    return resolver.promise;
};

var addStudentToCourse = function (code, uni) {
    var resolver = Promise.pending();
    if (!uni)
        return resolver.reject({message: 'Student`s uni is necessary', code: 400});
    Course.findOne({'code': code}, function (err, c) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        if (!c) return resolver.reject({message: 'Course not found', code: 404});
        if (_.find(c.students, {'uni': uni}))
            return resolver.reject({message: 'Student is already in course', code: 400});
        c.students.push({'uni': uni});
        c.save();
        resolver.resolve({
            student_uni: uni,
            course_code: code
        });
    });
    return resolver.promise;
};

var getStudentsInCourse = function (code) {
    var resolver = Promise.pending();
    Course.findOne({'code': code}, function (err, c) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        if (!c) return resolver.reject({message: 'Course not found', code: 404});
        console.log(c);
        var course = {
            students: _.map(c.students, function (s) {
                return {'uni': s.uni};
            })
        };
        resolver.resolve(course);
    });
    return resolver.promise;
};

var deleteStudentFromCourse = function (code, uni) {
    var resolver = Promise.pending();
    if (!uni)
        return resolver.reject({message: 'Student`s uni is necessary', code: 400});
    Course.findOne({'code': code}, function (err, c) {
        if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
        if (!c) return resolver.reject({message: 'Course not found', code: 404});
        if (!_.find(c.students, {'uni': uni}))
            return resolver.reject({message: 'Student is not in course', code: 400});
        var i = _.findIndex(c.students, {'uni': uni});
        c.students.splice(i, 1);
        c.save();
        resolver.resolve({
            student_uni: uni,
            course_code: code
        });
    });
    return resolver.promise;
};

var deleteStudentFromAllCourses = function(uni) {
    var resolver = Promise.pending();

    Course.find({'students.uni': uni})
        .exec(function (err, courses) {
            if (err) return resolver.reject({error: err, message: DB_ERROR, code: 500});
            _.each(courses, function (c) {
                c.students.splice(
                    _.findIndex(c.students, {'uni': uni}),
                    1);
                c.save();
            });
            resolver.resolve('Student is gone');
        });

    return resolver.promise;
};

exports.allCourses = allCourses;
exports.createCourse = createCourse;
exports.getCourseByCode = getCourseByCode;
exports.addStudentToCourse = addStudentToCourse;
exports.getStudentsInCourse = getStudentsInCourse;
exports.deleteStudentFromCourse = deleteStudentFromCourse;
exports.deleteStudentFromAllCourses = deleteStudentFromAllCourses;