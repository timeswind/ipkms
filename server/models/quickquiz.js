// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var quickquizSchema = mongoose.Schema({

    title: String,
    createdBy: { type: ObjectId, ref: 'Teacher' },
    questions: [{ type: ObjectId, ref: 'Question' }],
    time: Number, // minutes as unit
    samples: [{ type: ObjectId, ref: 'Quizsample', index: true}],
    analysis: {
        averageScore: Number,
        accuracy: [Number], //题目的由正确率从高到低排序
        rank: [{
            name: String,
            score: Number
        }]
    },
    startTime: Date,
    finishTime: Date,
    finished: Boolean

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quickquiz', quickquizSchema);
