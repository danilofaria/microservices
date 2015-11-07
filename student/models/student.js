var mongoose = require('mongoose');

var studentSchema = mongoose.Schema({
    name: String,
    lastName: String,
    uni: String,
}, {strict: false});
studentSchema.index({ uni: 1}, { unique: true });
var Student = mongoose.model('Student', studentSchema);

module.exports = Student;