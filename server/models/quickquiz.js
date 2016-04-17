// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var quickquizSchema = mongoose.Schema({

    title: String,
    createdBy: { type: ObjectId, ref: 'Teacher' },
    questions: [{ type: ObjectId, ref: 'Question' }],
    time: Number, // minutes as unit
    samples: [{
        student: { type: ObjectId, ref: 'Student' },
        answers: [Number], //a,b,c,d,a,b,c,d
        accuracy: {
            right: [Number], //question index in qcollection
            wrong: [Number], //question index in qcollection
            blank: [Number], //question index in qcollection
            exception: [Number] //handle bad question such as those doesn't have a answer or long question
        },
        time: String //精确的做题时间
    }],
    results: {
        accuracy: Number, //overall accurace unit is percentage
        samplesCount: Number
    },
    finished: Boolean

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quickquiz', quickquizSchema);
