var students = ['http://192.168.59.103:8081',
    'http://192.168.59.103:8082',
    'http://192.168.59.103:8083'];

var routes = {
    'http://192.168.59.103:8081': /^\/students\/[a-hA-H]/i,
    'http://192.168.59.103:8082': /^\/students\/[i-qI-Q]/i,
    'http://192.168.59.103:8083': /^\/students\/[r-zR-Z]/i,
    'http://192.168.59.103:8090': /^\/courses/i
};

exports.studentsUrls = students;
exports.routes = routes;