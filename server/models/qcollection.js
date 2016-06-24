var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var qcollectionSchema = mongoose.Schema({

    name: {type: String, index: true},
    subject: {type: String, index: true},
    description: String,
    public: {type: Boolean, index: true},
    aveDifficulty: {type: Number, index: true},
    createdBy: {type: ObjectId, ref: 'User'},
    questions: [{type: ObjectId, ref: 'Question', index: true}],
    created_at: Date,
    updated_at: Date

});

qcollectionSchema.pre('save', function (next) {
    var currentDate = new Date();
    this.updated_at = currentDate;
    if (!this.created_at) {
        this.created_at = currentDate;
    }
    next();
});

module.exports = mongoose.model('Qcollection', qcollectionSchema);
