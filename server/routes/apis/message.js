var express = require('express');
var router = express.Router();

var Chatroom = require('../../models/chatroom');


//获取小组的最近的20条消息
router.route('/catchup/:chatroom_id')
    .get(isLoggedIn, function (req, res) {
        var roomId = req.params.chatroom_id;
        Chatroom.findOne({group: roomId}).populate("messages.sender", "local.name").lean().exec(function (err, chatroom) {
            if (chatroom) {
                var messages;
                if (chatroom.messages.length > 20) {
                    messages = chatroom.messages.slice(Math.max(chatroom.messages.length - 20, 1));

                } else {
                    messages = chatroom.messages;
                }
                res.json(messages);
            } else {
                res.json([])
            }

        });

    });

router.route('/sync/:chatroom_id/:version')
    .get(isLoggedIn, function (req, res) {
        /** @namespace req.params.chatroom_id */
        /** @namespace req.params.version */
        var roomId = req.params.chatroom_id;
        var currentVersion = req.params.version;

        Chatroom.findOne({group: roomId}, "__v").lean().exec(function (err, c) {

            var difference = c.__v - currentVersion;
            var latestVersion = c.__v;

            if (difference > 0) {
                Chatroom.findOne({group: roomId},"messages", {messages: {$slice: difference}}).populate("messages.sender", "local.name").lean().exec(function (err, chatroom) {
                    if (chatroom) {
                        var results = {
                            version: latestVersion,
                            messages: chatroom.messages
                        };
                        res.json(results);
                    }
                });
            } else {
                res.json([])
            }

        });



    });

module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.user) {
        return next();
    } else {
        res.json("hello");
    }
}
