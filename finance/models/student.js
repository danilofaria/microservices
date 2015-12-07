var mongoose = require('mongoose');

var studentSchema = mongoose.Schema({
    name: String,
    lastName: String,
    balance: { type: Number, default: 0 },
    socialSecurityNumber: {type: String, required: true},
    uni: {type: String, required: true},
    tenantId: {type: String, required: true}
}, {strict: false});

var Student = mongoose.model('Student', studentSchema);

module.exports = Student;