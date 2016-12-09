var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var qcollectionSchema = mongoose.Schema({

  createdBy: {type: ObjectId, ref: 'User'},
  school: {type: String},
  name: {type: String},
  subject: {type: String},
  aveDifficulty: {type: Number},
  description: { type: String },
  questions: [{type: ObjectId, ref: 'Question'}],
  openForEdit: {type: Boolean},
  openInSchool: {type: Boolean},
  openOutSchool: {type: Boolean},
  openToStudent: {type: Boolean},
  created_at: Date,
  updated_at: Date

});

qcollectionSchema.index({createdBy: 1, name: 1})
qcollectionSchema.index({school: 1, openInSchool: 1, subject: 1, name: 1})
qcollectionSchema.index({school: 1, openInSchool: 1, subject: 1, name: 1})
qcollectionSchema.index({school: 1, openInSchool: 1, subject: 1, aveDifficulty: 1})
qcollectionSchema.index({school: 1, openToStudent: 1, subject: 1, aveDifficulty: 1})
qcollectionSchema.index({openOutSchool: 1, school: 1, subject: 1, aveDifficulty: 1})

module.exports = mongoose.model('Qcollection', qcollectionSchema);
