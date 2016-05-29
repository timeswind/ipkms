var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var groupSchema = mongoose.Schema({

    name: {type: String, index: true},
    owner: {type: ObjectId, ref: 'Teacher', index: true},
    public: {type: Boolean, index: true},
    students: [{type: ObjectId, ref: 'Student', index: true}],
    notice: {
        text: String,  //公告内容
        updated_at: Date //公告发布、更新时间
    },
    logs: [{
        writeBy: {type: ObjectId, ref: 'User'},
        date: {type: Date},
        event: String,
        text: String
    }]

});

groupSchema.pre('remove', function (next) {
    this.model('Chatroom').find({group: this._id}).remove(function (err) {
        if (err) {
            next(err)
        } else {
            next()
        }
    })
});

module.exports = mongoose.model('Group', groupSchema);
