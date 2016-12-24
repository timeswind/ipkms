var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var questionSchema = mongoose.Schema({
  createdBy: {type: ObjectId, ref: 'User'},
  school: {type: String},
  type: {type: String}, // mc / reading /...
  subject: {type: String},
  language: {type: String},
  tags: {type: [String]},
  difficulty: {type: Number, min: 0, max: 5}, // 难度系数1-5
  content: {type: String}, // Delta type question content, use for edit question
  choices: [{
    content: String,
    clue: String,
    correct: Boolean,
    count: Number
  }],
  images: [{
    type: {type: String},
    label: {type: String},
    data: {type: String}
  }],
  meta: [{
    _id: false,
    key: String, // 'multiple_answer'
    data: String // 'true'
  }],
  randomize: {type: Boolean, default: false},
  created_at: {type: Date, default: new Date()},
  updated_at: {type: Date, default: new Date()}
});

questionSchema.index({createdBy: 1, type: 1});
questionSchema.index({school: 1, _id: 1});
questionSchema.index({school: 1, tags: 1, difficulty: 1});
questionSchema.index({school: 1, subject: 1, difficulty: 1, tags: 1});
questionSchema.index({school: 1, subject: 1, tags: 1});

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
