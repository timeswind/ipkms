var socketioJwt = require('socketio-jwt');
var Chatroom = require('../models/chatroom');
var User = require('../models/localuser');
var randomMC = require('random-material-color');


exports = module.exports = function (io) {
    var users = [];

    io
        .on('connection', socketioJwt.authorize({
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
        console.log('socket id is ' + socket.id);
        //this socket is authenticated, we are good to handle more events from it.
        console.log('hello! ' + JSON.stringify(socket.decoded_token));

        users[socket.id] = {
            userid: socket.decoded_token.id,
            name: socket.decoded_token.name,
            role: socket.decoded_token.role,
            nameColor: randomMC.getColor()
        };

        console.log(users);

        socket.on('new user', function (data) {
            socket.join(data.roomId);
            Chatroom.count({group: data.roomId}, function (err, count) {
                if (count === 0) {
                    var chatroom = new Chatroom();
                    chatroom.group = data.roomId;
                    chatroom.save(function (err) {
                        if (err) {
                            io.in(data.roomId).emit('join fail');
                            socket.leave(data.roomId);
                        }
                    })
                } else {
                    //Tell all those in the room that a new user joined
                    io.in(data.roomId).emit('user joined', users[socket.id]);
                }
            })

        });

        // //Listens for switch room
        // socket.on('switch room', function (data) {
        //     //Handles joining and leaving rooms
        //     //console.log(data);
        //     socket.leave(data.oldRoom);
        //     socket.join(data.newRoom);
        //     io.in(data.oldRoom).emit('user left', data);
        //     io.in(data.newRoom).emit('user joined', data);
        //
        // });

        socket.on('new message', function (data) {
            //Create message
            data.userid = users[socket.id].userid;
            data.username = users[socket.id].name;
            data.nameColor = users[socket.id].nameColor;
            data.date = new Date();

            var newMsg = {
                sender: data.userid,
                content: data.text,
                img: null,
                date: data.date
            };
            //Save it to database
            Chatroom.update({group: data.roomId},
                {
                    $push: {
                        messages: {
                            $each: [ newMsg ],
                            $slice: -200
                        }
                    }
                },
                function (err) {
                    if (err) {
                        console.log("SAVE MESSAGES FAILED");
                        console.log(err);
                    }
                }
            );

            io.in(data.roomId).emit('emit message', data);
        });
    });
};