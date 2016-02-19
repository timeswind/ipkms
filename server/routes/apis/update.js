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



router.route('/teacher/thomework/:thomework_id/:option')  //update thomework info //teacher api
.put(isTeacher, function(req, res) {
  var thomework_id = req.params.thomework_id
  var option = req.params.option
  var data = Object.keys(req.body)[0];

  switch(option)
  {
    case "requirement":
    var newRequirement = data
    Thomework.findByIdAndUpdate(thomework_id, { $set: { requirement: newRequirement } },function(err){
      if(err) res.send(err)

      res.json("update thomework requirement success")
    })
    break;

    case "tags":
    var newTags = JSON.parse(data)
    Thomework.findByIdAndUpdate(thomework_id, { $set: { tags: newTags } },function(err){
      if(err) res.send(err)

      res.json("update thomework tags success")
    })
    break;

    case "publish":
    var publishData = JSON.parse(data)
    async.waterfall([
      function(callback) {
        Thomework.findByIdAndUpdate(thomework_id, { $set: { delivery: true, 'targetGroup.id': publishData.targetGroup, deadline: publishData.deadline } },function(err, thomework){
          if(err) { throw err; }

          callback(null, thomework.title)
        })
      },
      function(title, callback) {
        var newLog = {
          writeBy : req.user.id,
          date : Date.now(),
          event : "publish homework",
          text : "發佈了新功課 - " + title
        }
        Group.findByIdAndUpdate(publishData.targetGroup, { $push: { logs: newLog, homeworks: thomework_id} }, {safe: true, upsert: true}, function(err){
          if(err) { throw err; }

          callback(null)
        })
      }
    ], function(err) {
      if (err) return next(err);
      res.json("publish thomework success")
    });
    break;

    default:
    res.status(403)
  }


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
