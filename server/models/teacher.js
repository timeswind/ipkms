// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var teacherSchema = mongoose.Schema({

    user: {type: ObjectId, ref: 'User', index: true},
    name: {type: String, index: true},
    email: String,
    subjects: [String],
    year: {
        join: Date
    },
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
// create the model for users and expose it to our app
module.exports = mongoose.model('Teacher', teacherSchema);
