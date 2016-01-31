// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var shomeworkSchema = mongoose.Schema({

  student : {
    id : ObjectId,
    //       name : String
    //could populate student's name diractly
  },

  homeworks:[{

    thomework : {
      //                     title : String, //display homework
      //                     name : String,
      //                     subject : String, //homework details
      //                     deadline : Date, //show the date student need to submit the homework before
      id : { type: ObjectId, ref: 'Thomework' },
    },
    teacher : {  //for display the homework details
      id : { type: ObjectId, ref: 'Teacher' },
      //                   name : String
      //coule pupulate teacher object with teacher's name
    },
    answer : {
      photo : String, //photo with answer URL
      status : String //'not start'doing'submitted 'not start' 'woking' 'submitted'
    }


  }]



});

// create the model for users and expose it to our app
module.exports = mongoose.model('Shomework', shomeworkSchema);