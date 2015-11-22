var Joi = require('joi');

var Student = {
    hashKey: 'socialSecurityNumber',
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps: true,

    schema: {
        socialSecurityNumber: Joi.string().required(),
        name: Joi.string().required(),
        lastName: Joi.string(),
        birthYear: Joi.number().integer().min(1900).max(2015)
    }
};

exports.model = Student;