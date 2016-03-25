var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var qcollectionSchema = mongoose.Schema({

  name: String,
  subject: String,
  public: Boolean,//是否公开
  aveDifficulty: Number,
  createdBy: { type: ObjectId, ref: 'User' },
  questions: [{ type: ObjectId, ref: 'Question' }],
  created_at: Date,
  updated_at: Date

});

qcollectionSchema.pre('save', function(next) {
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at){
    this.created_at = currentDate;
  }
  next();
});

module.exports = mongoose.model('Qcollection', qcollectionSchema);
