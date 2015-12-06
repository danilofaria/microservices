var mongoose = require('mongoose');

var extraColumnsSchema = mongoose.Schema({
    name: {type: String, required: true},
    type: {type: String, default: 'String'},
    tenantId: {type: String, required: true}
});
extraColumnsSchema.index({name: 1, tenantId: 1}, {unique: true});

var ExtraColumns = mongoose.model('ExtraColumns', extraColumnsSchema);

module.exports = ExtraColumns;