// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var thomeworkSchema = mongoose.Schema({

  title: {type: String, index: true}, //home work title,such as math eqution practice
  delivery: {type: Boolean, index: true}, //teacher could pre-draft the homework and send the homework in the specific time
  teacher: {type: ObjectId, ref: 'Teacher', index: true},
  subject: {type: String, index: true}, // math, english, chinese
  tags: [{type: String, index: true}],
  requirement: String,
  group: {type: ObjectId, ref: 'Group', index: true},
  submitted: { type: [ObjectId], ref: 'Student', index: true},
  deadline: Date // indicate the time that the students need to submit the homework.

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Thomework', thomeworkSchema);
