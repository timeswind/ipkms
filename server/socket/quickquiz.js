var socketioJwt = require('socketio-jwt');
var User = require('../models/localuser');
var Student = require('../models/student');
var Teacher = require('../models/teacher');
var Quickquiz = require('../models/quickquiz');


exports = module.exports = function (io) {

    var users = {};

    io.of('/quickquiz').on('connection', socketioJwt.authorize({
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

        console.log('socket id for quickquiz is ' + socket.id);
        console.log('hello! ' + JSON.stringify(socket.decoded_token));

        if (socket.decoded_token.teacher) {
            users[socket.id] = {
                teacher: socket.decoded_token.teacher,
                name: socket.decoded_token.name,
                quickquiz: ''
            };
        } else if (socket.decoded_token.student) {
            users[socket.id] = {
                student: socket.decoded_token.student,
                name: socket.decoded_token.name,
                quickquiz: '',
                status: ''
            };
        }

        console.log(users);

        socket.on('user join', function (data) {

            // @param data
            // data = {
            //     quickquizId: String,
            //     status: String
            // }

            console.log('on user join');

            if (data.quickquizId) {
                Quickquiz.count({_id: data.quickquizId}, function (err, count) {

                    if (count === 1) {

                        var quickquizId = data.quickquizId;
                        socket.join(quickquizId);
                        users[socket.id].quickquiz = quickquizId;
                        if (data.status) {
                            users[socket.id].status = data.status;
                        }

                        console.log('user join success');

                        io.of('/quickquiz').in(quickquizId).to(socket.id).emit('joined');

                        if (users[socket.id].teacher) {
                            // 為教師發送當前在進行quizkquiz的學生列表
                            var students = []; // array of student ids
                            for (var key in users) {
                                if (users[key].student && users[key].quickquiz === quickquizId) {
                                    var student = {
                                        id: users[key].student,
                                        status: users[key].status
                                    };
                                    students.push(student)
                                }
                            }
                            io.of('/quickquiz').in(quickquizId).to(socket.id).emit('student list', students);
                        } else if (users[socket.id].student){
                            io.of('/quickquiz').in(quickquizId).emit('student joined', users[socket.id].student);
                        }

                    } else {
                        console.log('quickquiz not found!')
                    }
                })
            } else {
                console.log('student joined without quickquizId')
            }
        });

        socket.on('start doing', function (data) {
            users[socket.id].status = 'doing';
            io.of('/quickquiz').in(data.quickquizId).emit('start doing', users[socket.id].student);
        });

        socket.on('finish doing', function (data) {
            users[socket.id].status = 'finish';
            io.of('/quickquiz').in(data.quickquizId).emit('finish doing', users[socket.id].student);
        });

        socket.on('student leave', function (data) {
            io.of('/quickquiz').in(data.quickquizId).emit('student leaved', users[socket.id].student);
            delete users[socket.id];
        });


        socket.on('disconnect', function () {

            if (users[socket.id] && users[socket.id].quickquiz !== '' && users[socket.id].student) {
                io.of('/quickquiz').in(users[socket.id].quickquiz).emit('student leaved', users[socket.id].student);
            }
            socket.disconnect();

            delete users[socket.id];
            console.log("user leaved")
        });
    });


};