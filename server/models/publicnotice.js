// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var publicnoticeSchema = mongoose.Schema({

  title: String,
  text: String,
  sendBy: { type: ObjectId, ref: "User" },
  file: [String] //file path

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Publicnotice', publicnoticeSchema);
