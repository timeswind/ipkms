var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var questionSchema = mongoose.Schema({

  createdBy: {type: ObjectId, ref: 'User', index: true},
  school: { type: String, index: true },
  type: {type: String, index: true}, // mc / reading /...
  subject: {type: String, index: true},
  language: {type: String, index: true},
  tags: {type: [String], index: true},
  difficulty: {type: Number, index: true}, // 难度系数1-5
  context: String, // content
  delta: String, // Delta type question content, use for edit question
  choices: [String], //a b c d 选项
  answer: {
    mc: Number,
    fill: String
  },
  tips: String,
  statistic: {
    mc: [], // [a,b,c,d] for mc
    fill: [] // [count, right] for fill in the blank question
  },
  images: [{
    type: {type: String},
    label: {type: String},
    data: {type: String}
  }],
  draft: Boolean,
  created_at: Date,
  updated_at: Date

});

questionSchema.pre('save', function (next) {

  var currentDate = new Date();

  this.updated_at = currentDate;

  if (!this.created_at) {
    this.created_at = currentDate;
  }

  next();
});

questionSchema.pre('findOneAndUpdate', function (next) {
  var question_id = this._conditions._id;

  if (this.options && this.options.user_id) {
    var user_id = this.options.user_id;
    mongoose.model('Question', questionSchema).findById(question_id, function (err, question) {
      if (question) {
        if (question.createdBy == user_id) {
          next();
        } else {
          next(new Error("Permission denied !"));
        }
      } else {
        next(new Error("Something went wrong !"));
      }
    })
  } else {
    next();
  }

});

module.exports = mongoose.model('Question', questionSchema);
