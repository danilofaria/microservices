var mongoose = require('mongoose');

var studentSchema = mongoose.Schema({
    name: String,
    lastName: String,
    uni: String,
});
var Student = mongoose.model('Student', studentSchema);

module.exports = Student;