// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var teacherSchema = mongoose.Schema({

  user : { type: ObjectId, ref: 'User' },
  name : String,
  thomeworks : [{
    name : String,
    delivery : Boolean,
    group : ObjectId,
    thomework: { type: ObjectId, ref: 'Thomework' },
    count : String
  }],
  teachGroups : [{
    group : { type: ObjectId, ref: 'Group' },
    cName: String,
    _id: false,
  }]

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Teacher', teacherSchema);