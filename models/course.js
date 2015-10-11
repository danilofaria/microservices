var mongoose = require('mongoose');

var courseSchema = mongoose.Schema({
    code: String,
    title: String,
    students: [{ uni: String }]
});
courseSchema.index({ code: 1}, { unique: true });
var Course = mongoose.model('Course', courseSchema);

module.exports = Course;