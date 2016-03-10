var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');
var Question = require('../../models/question');

router.route('/new')
.post(isTeacher, function(req, res) {
  if(req.body){
    var jsonData = req.body;
    console.log(jsonData);

    var newQuestion = new Question();
    newQuestion.createdBy = req.user.id;
    newQuestion.type = jsonData.type;
    newQuestion.subject = jsonData.subject;
    newQuestion.context = jsonData.context;
    newQuestion.choices = jsonData.choices;
    if (jsonData.type === 'mc') {
      newQuestion.answer.mc = jsonData.answer.mc;
    } else {
      newQuestion.answer.long = jsonData.answer.long;
    }
    newQuestion.tags = jsonData.tags;
    newQuestion.difficulty = jsonData.difficulty;

    newQuestion.save(function(err, q) {
      if (err){
        res.send(err);
      }else{
        res.json(q)
      }
    });
  }
})


module.exports = router;

function isLoggedIn(req, res, next) {

  if (req.user){
    return next();
  }else{
    res.status(401);
  }
}

function isAdmin(req, res, next) {

  if (req.user.role == "admin"){
    return next();
  }else{
    res.status(401);
  }
}

function isTeacher(req, res, next) {

  if (req.user.role == "teacher"){
    return next();
  }else{
    res.status(401);
  }
}

function isStudent(req, res, next) {

  if (req.user.role == "student"){
    return next();
  }else{
    res.status(401);
  }
}
