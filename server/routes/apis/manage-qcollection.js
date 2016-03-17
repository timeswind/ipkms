var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');

var Question = require('../../models/question');
var Qcollection = require('../../models/qcollection');

//create new question collection
router.route('/new')
.post(isLoggedIn, function(req, res) {
  if(req.body){
    var jsonData = req.body;
    var newQcollection = new Qcollection();

    newQcollection.createdBy = req.user.id;
    newQcollection.subject = jsonData.subject;
    newQcollection.name = jsonData.name;
    newQcollection.public = jsonData.public;
    newQcollection.questions = jsonData.questions;

    newQcollection.save(function(err, q) {
      if (err){
        res.send(err);
      }else{
        res.json('create success')
      }
    });
  }
})

router.route('/mine')
.get(isLoggedIn, function(req, res) {
  Qcollection.find({createdBy:req.user.id}, 'name subject public').sort({_id:-1}).exec(function(err, qcollections){
    if (err) {
      res.send(err);
    } else {
      res.json(qcollections);
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
