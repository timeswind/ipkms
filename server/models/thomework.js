// load the things we need
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
// define the schema for our user model
var thomeworkSchema = mongoose.Schema({

    delivery : Boolean, //teacher could pre-draft the homework and send the homework in the specific time
    teacher : { type: ObjectId, ref: 'Teacher' },
    type : String,  //photo upload, multi choice, test paper 'photo'==>take photo and student get answer
                    //'mc' --> student submit mc
    subject : String, // math, english, chinese
    tags: [String],
    title : String, //home work title,such as math eqution practice
    qText : String, // if the type of the homewrok is photo upload, this field is the instruction that teacher need to include for students, like which question students need to take photo and upload.
    targetGroup :  {
                     group: ObjectId, //the group contain the students
                     submit : [{
                                 id : { type: ObjectId, ref: 'Student' }, //studentID who submitted the homework
                     }]
    },

    targetStudents : [{   //teachers could send the homework to specific students
                      student : ObjectId, //need add population
                      status : String //'not start';'doing';'submitted'
    }],
    mcId : ObjectId, // if the homework type is mc, then need to include the mc from the datebase 'mc'
    answer : ObjectId, // teacher could create the answer sets, which would send to students automatically after students submit their homework. the answer collection could include array of mc answers, as well as photos or docs documents.  'photo'
    deadline : Date, // indicate the time that the students need to submit the homework.



});

// create the model for users and expose it to our app
module.exports = mongoose.model('Thomework', thomeworkSchema);