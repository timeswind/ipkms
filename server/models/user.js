var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var ObjectId = mongoose.Schema.ObjectId;
// var uniqueValidator = require('mongoose-unique-validator');

var userSchema = mongoose.Schema({
  school: String,
  email: String,
  password: String,
  name: String,
  role: String,
  schoolId: String,
  class: String
});
userSchema.index({school: 1, schoolId: 1});
userSchema.index({school: 1, email: 1});
userSchema.index({school: 1, role: 1, email: 1});
userSchema.index({school: 1, role: 1, name: 1});
userSchema.index({school: 1, class: 1});

// userSchema.plugin(uniqueValidator, {
//   message : 'Name must be unique.'
// })

userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

var User = mongoose.model('User', userSchema)
User.on('index', function(error) {
  // "_id index cannot be sparse"
  if (error) {
    console.log(error.message);
  }
});
module.exports = User;
