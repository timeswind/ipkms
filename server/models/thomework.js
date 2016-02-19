// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var thomeworkSchema = mongoose.Schema({

  delivery : Boolean, //teacher could pre-draft the homework and send the homework in the specific time
  teacher : { type: ObjectId, ref: 'Teacher' },
  subject : String, // math, english, chinese
  tags: [String],
  title : String, //home work title,such as math eqution practice
  requirement : String,
  targetGroup :  {
    id: { type: ObjectId, ref: 'Group' }, //the group contain the students
    submit : [{ type: ObjectId, ref: 'Student' }], //studentID who submitted the homework
  },
  deadline : Date // indicate the time that the students need to submit the homework.

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Thomework', thomeworkSchema);
