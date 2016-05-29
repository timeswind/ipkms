// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var quizsampleSchema = mongoose.Schema({

    quickquiz: {type: ObjectId, ref: 'Quickquiz'},
    student: {type: ObjectId, ref: 'Student', index: true},
    answers: [Number], //a,b,c,d,a,b,c,d
    results: {
        right: [Number], //question index in qcollection
        wrong: [Number], //question index in qcollection
        blank: [Number], //question index in qcollection
        exception: [Number] //handle bad question such as those doesn't have a answer or long question
    },
    time: String, //精确的做题时间
    startTime: Date,
    finishTime: Date

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quizsample', quizsampleSchema);
