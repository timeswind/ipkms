// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var usernotiSchema = mongoose.Schema({

  userid : ObjectId,
  notis : [{ type: ObjectId, ref : 'Notitext'}]

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Usernoti', usernotiSchema);
