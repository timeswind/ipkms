var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');

var Question = require('../../models/question');
var Qcollection = require('../../models/qcollection');

//create new question collection
router.route('/add')
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
  } else {
    res.status(400);
  }
})

router.route('/delete/single')
.delete(isTeacher, function(req, res) {
  var qcollection_id = req.body.qcollection_id;
  if (qcollection_id) {
    Qcollection.findByIdAndRemove(qcollection_id, function (err){
      if(err) { throw err; }

      res.json('deleted')
    })
  } else {
    res.status(400);
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

//获取所有公开题集
router.route('/all')
.get(isLoggedIn, function(req, res) {
  Qcollection.find({ public: true }, 'name subject public createdBy').populate('createdBy', 'local.name').exec(function(err, qcollections){
    if (err) {
      res.send(err);
    } else {
      res.json(qcollections);
    }
  });
})

router.route('/detail/:qcollection_id')
.get(isLoggedIn, function(req, res) {
  var qcollection_id = req.params.qcollection_id;
  Qcollection.findById(qcollection_id, 'name subject public aveDifficulty questions').populate('questions', 'type context subject tags difficulty').exec(function(err, qcollection){
    if (err) {
      res.send(err);
    } else {
      res.json(qcollection);
    }
  });
})

router.route('/update-info')
.put(isLoggedIn, function(req, res) {
  var qcollection_id = req.body.qcollection_id;
  var updatedObject = {
    "name": req.body.name,
    "subject": req.body.subject,
    "public": req.body.public
  }
  Qcollection.findByIdAndUpdate(qcollection_id, updatedObject, {new: true}, function(err, qc) {
    if (err) {
      res.send(err);
    } else {
      res.json(qc);
    }
  })
})

router.route('/update-difficulty')
.put(isLoggedIn, function(req, res) {
  var qcollection_id = req.body.qcollection_id;
  var updatedObject = {
    "aveDifficulty": req.body.aveDifficulty,
  }
  Qcollection.findByIdAndUpdate(qcollection_id, updatedObject, function(err) {
    if (err) {
      res.send(err);
    } else {
      res.json('success');
    }
  })
})

router.route('/add-question')
.post(isLoggedIn, function(req, res) {
  if(req.body){
    console.log(req.body);
    var qcollection_id = req.body.qcollection_id;
    var question_id = req.body.question_id;

    Qcollection.findByIdAndUpdate(
      qcollection_id,
      {$addToSet: {"questions": question_id}},
      {safe: true, upsert: true, new : true},
      function(err, qc) {
        if (err) {
          res.send(err);
        } else {
          res.json("success");
        }
      }
    );
  }else {
    res.status(400);
  }
})

router.route('/remove-question')
.delete(isLoggedIn, function(req, res) {
  if(req.body){
    console.log(req.body);
    var qcollection_id = req.body.qcollection_id;
    var question_id = req.body.question_id;

    Qcollection.findByIdAndUpdate(
      qcollection_id,
      {$pull: {"questions": question_id}},
      function(err, qc) {
        if (err) {
          res.send(err);
        } else {
          res.json("success");
        }
      }
    );
  }else {
    res.status(400);
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
