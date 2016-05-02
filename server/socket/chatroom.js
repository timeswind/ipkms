var socketioJwt = require('socketio-jwt');
var Chatroom = require('../models/chatroom');
var User = require('../models/localuser');
var randomMC = require('random-material-color');


exports = module.exports = function (io) {

    var users = [];

    io.of('/chatroom').on('connection', socketioJwt.authorize({
            secret: function (request, decodedToken, callback) {
                User.findById(decodedToken.id, function (err, user) {
                    if (err) {
                        callback(null, SECRETS["fail"]);
                    } else {
                        callback(null, user.local.password);
                    }
                })
            },
            handshake: false
        })).on('authenticated', function (socket) {

        // console.log('socket id is ' + socket.id);
        // console.log('hello! ' + JSON.stringify(socket.decoded_token));

        users[socket.id] = {
            userid: socket.decoded_token.id,
            name: socket.decoded_token.name,
            role: socket.decoded_token.role,
            nameColor: randomMC.getColor()
        };

        console.log(users);

        socket.on('new user', function (data) {
            if (data.roomId) {
                socket.join(data.roomId);
                Chatroom.count({group: data.roomId}, function (err, count) {
                    if (count === 0) {
                        var chatroom = new Chatroom();
                        chatroom.group = data.roomId;
                        chatroom.save(function (err) {
                            if (err) {
                                io.of('/chatroom').in(data.roomId).emit('join fail');
                                socket.leave(data.roomId);
                            }
                        })
                    } else {
                        io.of('/chatroom').in(data.roomId).emit('user joined', users[socket.id]);
                    }
                })
            }
        });

        socket.on('new message', function (data) {
            data.userid = users[socket.id].userid;
            data.username = users[socket.id].name;
            data.role = users[socket.id].role;
            data.nameColor = users[socket.id].nameColor;
            data.date = new Date();

            var newMsg = {
                sender: data.userid,
                content: data.text,
                img: null,
                date: data.date
            };

            //broadcast to subscriber
            io.of('/chatroom').in(data.roomId).emit('emit message', data);

            //Save it to database
            Chatroom.update({group: data.roomId},
                {
                    $push: {
                        messages: {
                            $each: [newMsg],
                            $slice: -500
                        }
                    },
                    $inc: {__v: 1}
                },
                function (err) {
                    if (err) {
                        console.log("SAVE MESSAGES FAILED");
                        console.log(err.message);
                    }
                }
            );
        });

        socket.on('disconnect', function () {

            delete users[socket.id];
            console.log("user disconnected")
        });
    });


};