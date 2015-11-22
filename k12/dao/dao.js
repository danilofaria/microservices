var _ = require('lodash');

var DAO = function DAO(model, hashName) {
    this.model = model;
    this.hashName = hashName;
};

DAO.prototype.getAll = function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
        _this.model.scan().loadAll().exec(function (err, result) {
            if (!err) {
                resolve(_.map(result.Items, 'attrs'));
            } else {
                reject(err);
            }
        })
    });
};

DAO.prototype.update = function (hash, update) {
    update[this.hashName] = hash;
    return this.model.updateAsync(update)
        .then(function (result) {
            return result.attrs;
        });
};

DAO.prototype.create = function (s) {
    return this.model.createAsync(s)
        .then(function (result) {
            return result.attrs;
        });
};

DAO.prototype.get = function (hash) {
    var params = {};
    params[this.hashName] = hash;
    return this.model.getAsync(params)
        .then(function (r) {
            return r.attrs
        });
};

DAO.prototype.destroy = function (hash) {
    var params = {};
    params[this.hashName] = hash;
    return this.model.destroyAsync(params)
        .then(function (r) {
            return 'deleted';
        });
};

module.exports = function(model, hashName) {
  return new DAO(model, hashName);
};