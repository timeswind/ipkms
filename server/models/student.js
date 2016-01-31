// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var studentSchema = mongoose.Schema({

  user : { type: ObjectId, ref: 'User' },
  name : String,
  schoolId : String,
  pic: String,
  shomeworks : { type: ObjectId, ref: 'Shomework' },
  Groups : [{
    id : { type: ObjectId, ref: 'Group' }
  }]

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Student', studentSchema);