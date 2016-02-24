var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');
var Chatroom = require('../../models/chatroom');



router.route('/catchup/:chatroom_id')  //delete one thomework //teacher api
.get(isLoggedIn, function(req, res) {
  var roomId = req.params.chatroom_id;
  Chatroom.findOne({group: roomId}).populate("messages.sender", "local.name").exec(function(err, chatroom){
    var messages = chatroom.messages.slice(Math.max(chatroom.messages.length - 10, 1));

    res.json(messages);
  });

})

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
