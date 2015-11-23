var Promise = require('bluebird'),
    _ = require('lodash');

var DB_ERROR = 'Error occurred: database error.',
    DAO = function DAO(model, identifierName, columns, validator) {
        this.model = model;
        this.columns = columns;
        this.identifierName = identifierName;
        this.validator = validator;
    };

DAO.prototype.getAllValuesForColumns = function (cols) {
    return function (r) {
        var result = {};
        cols.forEach(function (col) {
            result[col.name] = r.get(col.name) || null;
        });
        return result;
    };
};

DAO.prototype.getAll = function () {
    var _this = this;
    return this.model.findAsync()
        .then(function (all) {
            var popo = '2';
            return _this.columns()
                .then(function (cols) {
                    return all.map(_this.getAllValuesForColumns(cols));
                });
        })
        .catch (function (err) {
            return Promise.rejected({error: err, message: DB_ERROR, code: 500});
        });
};

DAO.prototype.get = function (identifier) {
    var _this = this,
        params = {};
    params[this.identifierName] = identifier;

    return this.model.findOneAsync(params)
        .catch(function (err) {
            return Promise.rejected({error: err, message: DB_ERROR, code: 500});
        })
        .then(function (r) {
            if (!r) return Promise.rejected({message: 'Record not found', code: 404});
            return _this.columns()
                .then(function (cols) {
                    return _this.getAllValuesForColumns(cols)(r);
                });
        });
};

DAO.prototype.destroy = function (identifier) {
    var params = {};
    params[this.identifierName] = identifier;
    return this.model.findOneAndRemoveAsync(params)
        .catch(function (err) {
            return Promise.rejected({error: err, message: DB_ERROR, code: 500});
        })
        .then(function (r) {
            if (!r) return Promise.rejected({message: 'Record not found', code: 404});
            return {id: r._id};
        });
};

DAO.prototype.update = function (identifier, body) {
    var _this = this,
        params = {},
        update = {};
    params[this.identifierName] = identifier;

    return this.columns().then(function (cols) {
        cols.forEach(function (col) {
            if (body[col.name])
                update[col.name] = body[col.name];
        });
        return _this.model.findOneAndUpdateAsync(params, update)
            .catch(function (err) {
                return Promise.rejected({error: err, message: DB_ERROR, code: 500});
            })
            .then(function (r) {
                if (!r) return Promise.rejected({message: 'Record not found', code: 404});
                return {updated: update};
            });
    });
};


DAO.prototype.create = function (body) {
    var _this = this,
        record = {};

    if (!this.validator(body))
        return Promise.rejected({error: err, message: 'Invalid record', code: 400});

    return this.columns().then(function (cols) {
        cols.forEach(function (col) {
            record[col.name] = body[col.name] || null;
        });
        var r = new _this.model(record);

        return new Promise(function (resolve, reject) {
            r.save(function (err, s) {
                if (err) return reject({error: err, message: DB_ERROR, code: 500});
                return resolve({id: s._id});
            });
        });
    });
};

module.exports = function (model, identifierName, columns, validator) {
    return new DAO(model, identifierName, columns, validator);
};