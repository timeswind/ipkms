// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var studentSchema = mongoose.Schema({

  user: {type: ObjectId, ref: 'User', index: true},
  name: {type: String, index: true},
  school: {type: String, index: true}, // School Code
  schoolId: {type: String, index: true},
  graduate: Boolean, //是否毕业
  grade: Number,
  class: String,
  pic: String

});

studentSchema.pre('save', function (next) {
  var self = this;
  if (self.schoolId.length !== 8 || self.name.trim() === '') {
    next(new Error("schoolId or name format not good!"));
  } else {
    mongoose.model('Student', studentSchema).find({schoolId: self.schoolId}, function (err, student) {
      if (!student.length) {
        next();
      } else {
        next(new Error("schoolId exists!"));
      }
    });
  }
})

studentSchema.pre('findOneAndUpdate', function (next) {
  var self = this._update;
  var student_id = this._conditions._id
  if (self.schoolId.length !== 8 || self.name.trim() === '') {
    next(new Error("schoolId or name format not good!"));
  } else {
    mongoose.model('Student', studentSchema).find({schoolId: self.schoolId}, function (err, student) {
      if (!student.length) {
        next();
      } else {
        if (student[0].id === student_id) {
          next();
        } else {
          next(new Error("schoolId exists!"));
        }
      }
    });
  }
})

// create the model for users and expose it to our app
module.exports = mongoose.model('Student', studentSchema);
