var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var ObjectId = mongoose.Schema.ObjectId;

var userSchema = mongoose.Schema({

  local: {
    email: String,
    school: String, // enable School code for furture expention
    schoolId: {type: String, index: true},
    password: String,
    name: String,
    role: String,
    teacher: {type: ObjectId, ref: 'Teacher', index: true},
    student: {type: ObjectId, ref: 'Student', index: true},
    last_login: Date
  }

});

userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
