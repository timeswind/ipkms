// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var groupSchema = mongoose.Schema({

    name: String,
    tags: [String],
    public: {
        boolean: Boolean,
        owner: {type: ObjectId, ref: 'Teacher'}
    },
    students: [{
        id: {type: ObjectId, ref: 'Student'}
    }],
    teachers: [{type: ObjectId, ref: 'Teacher'}],
    notice: {
        text: String,  //公告内容
        updated_at: {type: Date}  //公告发布、更新时间
    },
    logs: [{
        writeBy: {type: ObjectId, ref: 'User'},
        date: {type: Date},
        event: String,
        text: String
    }],
    homeworks: [{type: ObjectId, ref: 'Thomework'}]

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
// create the model for users and expose it to our app
module.exports = mongoose.model('Group', groupSchema);
