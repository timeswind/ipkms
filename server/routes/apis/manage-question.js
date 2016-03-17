var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');

var Question = require('../../models/question');

//create new question
router.route('/new')
.post(isTeacher, function(req, res) {
  if(req.body){
    var jsonData = req.body;
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

router.route('/latest')
.get(isTeacher, function(req, res) {
  Question.find({}, 'context tags subject difficulty type').sort({_id:-1}).limit(10).exec(function(err, questions){
    if (err) {
      res.send(err);
    } else {
      res.json(questions);
    }
  });
})

router.route('/delete/single/:question_id')
.delete(isTeacher, function(req, res) {
  var question_id = req.params.question_id;
  if (question_id) {
    Question.findByIdAndRemove(question_id, function (err){
      if(err) { throw err; }

      res.json('deleted')
    })
  } else {
    res.status(400);
  }
})

//获取用户自己创建的题目
router.route('/mine')
.get(isTeacher, function(req, res) {
  Question.find({createdBy:req.user.id}, 'context tags subject difficulty type').sort({_id:-1}).limit(10).exec(function(err, questions){
    if (err) {
      res.send(err);
    } else {
      res.json(questions);
    }
  });
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
