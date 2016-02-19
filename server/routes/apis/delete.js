var async = require("async");
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');
var Group = require('../../models/group')
var Thomework = require('../../models/thomework');
var Shomework = require('../../models/shomework');



router.route('/teacher/thomework/:thomework_id')  //delete one thomework //teacher api
.delete(isTeacher, function(req, res) {
  var thomework_id = req.params.thomework_id

  async.waterfall([
    function(callback) {
      Thomework.findById(thomework_id,function(err, thomework){
        if (thomework.teacher == req.user.teacher ) {
          if(err) { throw err; }

          callback(null, thomework.targetGroup.id)
        } else {
          res.status(401).json("not authorised")
        }
      })
    },
    function(targetGroup, callback) {
      Group.findByIdAndUpdate(targetGroup, { $pull: { homeworks :  thomework_id  } },{ safe: true }, function (err){
        if(err) { throw err; }

        callback()
      })
    },
    function(callback) {
      Teacher.findByIdAndUpdate(req.user.teacher,{ $pull: { thomeworks :  thomework_id  } },{ safe: true }, function (err){
        if(err) { throw err; }

        callback()
      })
    },
    function(callback) {
      Thomework.findByIdAndRemove(thomework_id, function (err, thomework){
        if(err) { throw err; }

        callback()
      })
    }
  ], function(err) {
    if (err) return next(err);
    res.json("success delete the thomework !");
  });

});

module.exports = router;

function isLoggedIn(req, res, next) {

  if (req.user){
    return next();
  }else{
    res.json("hello");
  }
}

function isAdmin(req, res, next) {

  if (req.user.role == "admin"){
    return next();
  }else{
    res.json("hello");
  }
}

function isTeacher(req, res, next) {

  if (req.user.role == "teacher"){
    return next();
  }else{
    res.json("hello");
  }
}

function isStudent(req, res, next) {

  if (req.user.role == "student"){
    return next();
  }else{
    res.json("hello");
  }
}
