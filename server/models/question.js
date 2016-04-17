// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var questionSchema = mongoose.Schema({

    createdBy: {type: ObjectId, ref: 'User'},
    type: String, //mc or long question
    subject: String,
    context: String,
    choices: [String], //a b c d 选项
    answer: {
        mc: Number,
        long: String
    },
    tags: [String],
    difficulty: Number, //难度系数1-5
    tips: String,
    accuracy: {
        correct: Number,
        wrong: Number
    },
    created_at: Date,
    updated_at: Date

});

// on every save, add the date
questionSchema.pre('save', function (next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at) {
        this.created_at = currentDate;
    }

    next();
});

questionSchema.pre('remove', function (next) {
    console.log('triger pre move');
    this.model('Qcollection').update(
        {questions: this._id},
        {$pull: {questions: this._id}},
        {multi: true},
        next
    );
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);
