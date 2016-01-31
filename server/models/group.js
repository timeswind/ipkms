// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var groupSchema = mongoose.Schema({

  name :　String,
  tags : [String],
  public : {
    boolean : Boolean,
    owner : { type: ObjectId, ref: 'Teacher' }
  },
  students : [{
    _id:false,
    id: { type: ObjectId, ref: 'Student' }
  }],
  teachers : [{ type: ObjectId, ref: 'Teacher' }]

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Group', groupSchema);