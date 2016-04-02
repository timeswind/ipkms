var async = require("async");
var express = require('express');
var router = express.Router();

var User = require('../../models/localuser');
var Chatroom = require('../../models/chatroom');


//获取小组的最近的10条消息
router.route('/catchup/:chatroom_id')
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
