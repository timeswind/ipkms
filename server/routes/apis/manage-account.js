var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');

router.route('/user-teacher')
.post(isAdmin, function(req, res) {
  if (Object.keys(req.body)[0]) {
    var user_id = Object.keys(req.body)[0];

    async.waterfall([
      validate,
      newTeacher,
      updateUser,
    ], function (err, result) {
      if (result) {
        res.send("success");
      }
    });

    function validate(callback) {
      User.findById(user_id, function(err, user){
        if(err) res.send(err);

        if (user.local.role !== "teacher" || !user.local.teacher) {
          callback(null, user.local.name);
        } else {
          res.status(500);
        }
      })
    }
    function newTeacher(name, callback) {
      var newTeacher = new Teacher();
      newTeacher.user = user_id;
      newTeacher.name = name;
      newTeacher.save(function(err, t){
        if(err)
        res.send(err);

        callback(null, t.id);
      })
    }
    function updateUser(teacher_id, callback) {

      User.findByIdAndUpdate(user_id, { $set: { 'local.role': 'teacher', 'local.teacher': teacher_id } },function(err){
        if(err) res.send(err);

        callback(null, 'success');
      })
    }
  } else {
    res.status(500);
  }

})
.delete(isAdmin, function(req, res) {
  if (Object.keys(req.body)[0]) {
    var user_id = Object.keys(req.body)[0];

    async.waterfall([
      validate,
      deleteTeacher,
      updateUser,
    ], function (err, result) {
      if (result) {
        res.send("success");
      }
    });

    function validate(callback) {
      User.findById(user_id, function(err, user){
        if(err) res.send(err);

        if (user.local.role == "teacher" && user.local.teacher) {
          callback(null, user.local.teacher);
        } else {
          res.status(500);
        }
      })
    }
    function deleteTeacher(teacher_id, callback) {
      Teacher.findByIdAndRemove(teacher_id, function (err){
        if(err) res.send(err);

        callback(null);
      })
    }
    function updateUser(callback) {

      User.findByIdAndUpdate(user_id, { $set: { 'local.role': 'user', 'local.teacher': undefined } },function(err){
        if(err) res.send(err);

        callback(null, 'success');
      })
    }

  } else {
    res.status(500);
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
