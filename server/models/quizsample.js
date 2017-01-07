// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var Mixed = mongoose.Schema.Types.Mixed
// define the schema for our user model
var quizsampleSchema = mongoose.Schema({

  title: String,
  quickquiz: {type: ObjectId, ref: 'Quickquiz'},
  student: {type: ObjectId, ref: 'User'},
  answers: [{
    _id: false,
    key: String,
    data: Mixed,
    correct: Boolean,
    blank: Boolean,
    exception: Boolean
  }],
  report: [{
    _id: false,
    key: String,
    data: String
  }],
  // weeknessTags: [String],
  // difficultyLevel: Number,
  // right: [String], //questioin id in qcollection
  // wrong: [String], //questioin id in qcollection
  // blank: [String], //questioin id in qcollection
  // exception: [String], //handle bad question such as those doesn't have a answer or long question
  score: Number,
  startAt: Date,
  finishAt: Date

});

quizsampleSchema.index({student: 1})
quizsampleSchema.index({quickquiz: 1, student: 1})

// create the model for users and expose it to our app
module.exports = mongoose.model('Quizsample', quizsampleSchema);
