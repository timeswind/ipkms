// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var questionSchema = mongoose.Schema({

  createdBy : { type: ObjectId, ref: 'User' },
  type : String, //mc or long question
  subject : String,
  context : String,
  choices : [String], //a b c d 选项
  answer : {
    mc : Number,
    long : String
  },
  tags : [String],
  difficulty : Number, //难度系数1-5
  tips : String

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);
