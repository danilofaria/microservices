var Promise = require("bluebird"),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    config = require('./config/config.js'),
    express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    adminApp = express(),
    progApp = express(),
    userApp = express(),
    app = express();

app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect(config.mongoAddress);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + config.mongoAddress));
db.once('open', function (callback) {
    console.log('succesfully connected to mongodb');
});

var DAO = require('./dao/dao.js'),
    ExtraColumns = Promise.promisifyAll(require('./models/column.js')),
    ExtraColumnsDAO = DAO(ExtraColumns, ['name', 'tenantId']),
    Student = Promise.promisifyAll(require('./models/student.js'));

var columnGetter = function (tenantId) {
    return ExtraColumnsDAO.getAllWithParams.bind(ExtraColumnsDAO, {tenantId: tenantId});
};

var studentDAOFactory = function (tenantId) {
    return DAO(Student, ['uni', 'tenantId'], columnGetter(tenantId));
};

var requestHandlerFactory = function (responseMaker) {
    return function (req, res) {
        responseMaker(req)
            .then(function (cols) {
                res.json(cols);
            })
            .catch(function (err) {
                res.status(err.code).send(err.message);
            });
    }
};

progApp.route('/user/:userId/schema')
    .get(requestHandlerFactory(function (req) {
        return ExtraColumnsDAO.getAllWithParams({tenantId: req.params.userId});
    }))
    .post(jsonParser, requestHandlerFactory(function (req) {
        console.log('received data ' + JSON.stringify(req.body));
        var body = _.merge(req.body, {tenantId: req.params.userId});
        return ExtraColumnsDAO.create(body);
    }));

progApp.route('/user/:userId/schema/:colName')
    .delete(requestHandlerFactory(function (req) {
        var params = {tenantId: req.params.userId, name: req.params.colName};
        return ExtraColumnsDAO.destroy(params);
    }))
    // todo: when updating columns name, update student collection to reflect column name change
    .put(jsonParser, requestHandlerFactory(function (req) {
        var params = {tenantId: req.params.userId, name: req.params.colName};
        return ExtraColumnsDAO.update(params, req.body);
    }));

userApp.get('/:userId/students',
    requestHandlerFactory(function (req) {
            var tenantId = req.params.userId;
            return studentDAOFactory(tenantId)
                .getAllWithParams({tenantId: tenantId});
        }
    ));

userApp.route('/:userId/students/:uni')
    .put(jsonParser,
        requestHandlerFactory(function (req) {
            console.log('received data ' + JSON.stringify(req.body));
            var tenantId = req.params.userId,
                uni = req.params.uni,
                params = {tenantId: tenantId, uni: uni};
            return studentDAOFactory(tenantId)
                .update(params, req.body);
        }))
    .get(requestHandlerFactory(function (req) {
        var tenantId = req.params.userId,
            uni = req.params.uni,
            params = {tenantId: tenantId, uni: uni};
        return studentDAOFactory(tenantId)
            .get(params);
    }));

adminApp.delete('/users/:userId/students/:uni',
    requestHandlerFactory(function (req) {
        var tenantId = req.params.userId,
            uni = req.params.uni,
            params = {tenantId: tenantId, uni: uni};
        return studentDAOFactory(tenantId)
            .destroy(params);
    }));

adminApp.post('/users/:userId/students', jsonParser,
    requestHandlerFactory(function (req) {
        console.log('received data ' + JSON.stringify(req.body));
        var tenantId = req.params.userId,
            body = _.merge(req.body, {tenantId: tenantId});
        return studentDAOFactory(tenantId)
            .create(body);
    }));

app.use('/users', userApp);
adminApp.use('/users', userApp);
app.use('/prog', progApp);
app.use('/admin', adminApp);

var server = app.listen(config.port, function () {
    var host = server.address().address,
        port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});