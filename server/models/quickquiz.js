var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var quickquizSchema = mongoose.Schema({

    title: {type: String, index: true},
    createdBy: {type: ObjectId, ref: 'Teacher', index: true},
    questions: [{type: ObjectId, ref: 'Question', index: true}],
    time: Number, // in minute
    students: [{type: ObjectId, ref: 'Student', index: true}],
    samples: [{type: ObjectId, ref: 'Quizsample', index: true}],
    analysis: {
        average: {
            right: Number, //平均正确题数
            time: Number   //平均耗时
        },
        questions: [], // [rightCount, wrongCount, blankCount, exceptionCount]
        tags: {
            weakest: [String],
            strongest: [String]
        },
        rank: [{
            name: String,
            id: ObjectId,
            score: Number,
            time: Number
        }],
        exceptions: [Number]
    },
    startTime: Date,
    finishTime: Date,
    finished: Boolean

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quickquiz', quickquizSchema);
