// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var shomeworkSchema = mongoose.Schema({

  student : { type: ObjectId, ref: 'Student' },

  homeworks:[{
    thomework : { type: ObjectId, ref: 'Thomework' },
    teacher : {type: ObjectId, ref: 'Teacher' },
    answer : {
      photo : String, //photo with answer URL
      status : String //'not start'doing'submitted 'not start' 'woking' 'submitted'
    }
  }]



});

// create the model for users and expose it to our app
module.exports = mongoose.model('Shomework', shomeworkSchema);
