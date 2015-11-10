var students = ['http://192.168.59.103:8081',
    'http://192.168.59.103:8082',
    'http://192.168.59.103:8083'];

var routes = {
    'http://192.168.59.103:8081': /^\/students\/[a-hA-H][a-zA-Z0-9]*$/i,
    'http://192.168.59.103:8082': /^\/students\/[i-qI-Q][a-zA-Z0-9]*$/i,
    'http://192.168.59.103:8083': /^\/students\/[r-zR-Z][a-zA-Z0-9]*$/i,
    'http://192.168.59.103:8090': /^\/courses/i
};

exports.studentsUrls = students;
exports.routes = routes;