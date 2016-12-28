var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var groupSchema = mongoose.Schema({

  name: {type: String},
  owner: {type: ObjectId, ref: 'User'},
  students: [{type: ObjectId, ref: 'User'}],
  notice: {
    content: String,  //公告内容
    date: Date //公告发布、更新时间
  },
  logs: [{
    by: {type: ObjectId, ref: 'User'},
    date: {type: Date},
    event: String,
    content: String
  }]

});


module.exports = mongoose.model('Group', groupSchema);
