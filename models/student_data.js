var mongoose = require('mongoose');

var studentDataSchema = mongoose.Schema({
    name: String,
    type: String
});
studentDataSchema.index({ name: 1}, { unique: true });
var StudentData = mongoose.model('StudentData', studentDataSchema);

module.exports = StudentData;