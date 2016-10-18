var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var quickquizSchema = mongoose.Schema({

  title: {type: String, index: true},
  createdBy: {type: ObjectId, ref: 'Teacher', index: true},
  questions: [{type: ObjectId, ref: 'Question', index: true}],
  time: Number, // in minute
  students: [{type: ObjectId, ref: 'Student', index: true}],
  samples: [{type: ObjectId, ref: 'Quizsample'}],
  analysis: {
    aveRight: {type: Number, default: null},
    aveTime: {type: Number, default: null},
    questions: [], // [rightCount, wrongCount, blankCount, exceptionCount]
    weakTags: [String],
    strongTags: [String],
    exceptions: [Number]
  },
  startTime: Date,
  finishTime: Date,
  finished: Boolean

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quickquiz', quickquizSchema);
