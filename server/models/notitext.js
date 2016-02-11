// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var notitextSchema = mongoose.Schema({

  event : String, //"homework" "test result" "message" "public massage"
  text : String,
  sendBy : { type:ObjectId, ref:"User"}

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Notitext', notitextSchema);
