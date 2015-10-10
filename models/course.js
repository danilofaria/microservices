var mongoose = require('mongoose');

var courseSchema = mongoose.Schema({
    code: String,
    title: String
});
var Course = mongoose.model('Course', courseSchema);

module.exports = Course;