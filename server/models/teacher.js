var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var teacherSchema = mongoose.Schema({

  user: {type: ObjectId, ref: 'User', index: true},
  school: {type: String, index: true}, // School Code
  name: {type: String, index: true},
  email: String,
  subjects: [String],
  contact: {
    phone: String,
    wechat: String,
    facebook: String
  }
});

teacherSchema.pre('save', function (next) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  var self = this;
  if (!re.test(self.email) || self.name.trim() === '') {
    next(new Error("Incorrect params or the email is not correct!"));
  } else {
    mongoose.model('Teacher', teacherSchema).find({email: self.email}, function (err, teacher) {
      if (!teacher.length) {
        next();
      } else {
        console.log('Same email exists: ', self.email);
        next(new Error("Same email exists!"));
      }
    });
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);
