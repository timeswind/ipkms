// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var quickquizSchema = mongoose.Schema({

    title: { type: String, index: true },
    createdBy: {type: ObjectId, ref: 'Teacher', index: true},
    questions: [{type: ObjectId, ref: 'Question', index: true}],
    time: Number, // minutes as unit
    students: [{type: ObjectId, ref: 'Student', index: true}],
    samples: [{type: ObjectId, ref: 'Quizsample', index: true}],
    analysis: {
        average: {
            right: Number,
            score: Number,
            time: Number
        },
        percentages: {
            rights: [Number], //题目的正确率, 按順序排列
            wrongs: [Number],
            blanks: [Number]
        },
        tags: {
          weakest: [String],
          strongest: [String]
        },
        rank: [{
            name: String,
            score: Number,
            time: Number
        }]
    },
    startTime: Date,
    finishTime: Date,
    finished: Boolean

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quickquiz', quickquizSchema);
