var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var quickquizSchema = mongoose.Schema({

  createdBy: {type: ObjectId, ref: 'User'},
  school: {type: String},
  title: {type: String},
  subject: {type: String},
  duration: {type: Number}, // in minute
  questions: [{type: ObjectId, ref: 'Question'}],
  students: [{type: ObjectId, ref: 'User'}],
  report: [{
    _id: false,
    key: String,
    data: String
  }],
  finished: Boolean,
  startAt: Date,
  endAt: Date
  // analysis: {
  //   aveRight: {type: Number, default: null},
  //   aveTime: {type: Number, default: null},
  //   questions: [], // [rightCount, wrongCount, blankCount, exceptionCount]
  //   weakTags: [String],
  //   strongTags: [String],
  //   exceptions: [Number]
  // },
});

quickquizSchema.index({createdBy: 1, name: 1})
quickquizSchema.index({school: 1, subject: 1, name: 1})

// create the model for users and expose it to our app
module.exports = mongoose.model('Quickquiz', quickquizSchema);
