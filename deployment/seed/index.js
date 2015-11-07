var students = [{
    'name': 'Albert',
    'uni': 'alj123',
    'lastName': 'Junior'
},
    {
        'name': 'Frederick',
        'uni': 'fr325',
        'lastName': 'Ross'
    },
    {
        'name': 'Hendrickson',
        'uni': 'hl525',
        'lastName': 'Lobowski'
    },
    {
        'name': 'Jane',
        'uni': 'jt534',
        'lastName': 'Thomas'
    },
    {
        'name': 'Karlie',
        'uni': 'kc345',
        'lastName': 'Claus'
    },
    {
        'name': 'Penelope',
        'uni': 'pp273',
        'lastName': 'Pillow'
    },
    {
        'name': 'Tasha',
        'uni': 'tm435',
        'lastName': 'Maple'
    },
    {
        'name': 'Vince',
        'uni': 'vt642',
        'lastName': 'Thomason'
    },
    {
        'name': 'Yovan',
        'uni': 'yw345',
        'lastName': 'Wood'
    }];

var courses = [{
    'title': 'Intro to Databases',
    'code': 'COM3940',
    'students': ['alj123', 'jt534', 'vt642']
},
    {
        'title': 'Advanced Digital Rendering',
        'code': 'ANI4983',
        'students': ['fr325', 'pp273', 'yw345', 'alj123']
    },
    {
        'title': 'Effect Theory Applied to Everyday Life',
        'code': 'SOC3645',
        'students': ['hl525', 'kc345', 'tm435']
    }];


var request = require('request');
var _ = require('lodash');
var Promise = require("bluebird");

var url = 'http://localhost:8000';

_.each(students, function (s) {
    request.post({
        headers: {'content-type': 'application/json'},
        url: url + '/students',
        body: JSON.stringify(s)
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log('all good. added student ' + s.uni);
        } else if (error) {
            console.log(error.toString());
        } else {
            console.log(body);
        }
    });
});

var addStudentsToCourse = function(c) {
    _.each(c.students, function(uni) {
        request.post({
            headers: {'content-type': 'application/json'},
            url: url + '/courses/' + c.code + '/students',
            body: JSON.stringify({'uni' : uni})
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log('student ' + uni + ' added to course ' + c.code);
            } else {
                console.log(error);
                console.log(body);
            }
        });
    });
}

_.each(courses, function (c) {
    request.post({
        headers: {'content-type': 'application/json'},
        url: url + '/courses',
        body: JSON.stringify(c)
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log('all good. added course ' + c.code);
            addStudentsToCourse(c);
        } else {
            console.log(error);
            console.log(body);
        }
    });
});