// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var chatroomSchema = mongoose.Schema({

  group: {type: ObjectId, ref: "Group", index: true},
  messages: [{
    sender: {type: ObjectId, ref: "User"},
    content: String,
    img: String,
    date: Date
  }]

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Chatroom', chatroomSchema);
