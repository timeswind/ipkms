var socketioJwt = require('socketio-jwt');
var _ = require('lodash');
var User = require('../models/user');
var Student = require('../models/student');
var Teacher = require('../models/teacher');
var Quickquiz = require('../models/quickquiz');
var Quizsample = require('../models/quizsample');
var redisClient = require('../config/redis_database').redisClient;
var fs = require('fs')
var publicKey = fs.readFileSync('ipkms.rsa.pub');

exports = module.exports = function (io) {

  var users = {};
  var teachers = {};

  io.of('/quickquiz')
  .on('connection', socketioJwt.authorize({
    secret: publicKey,
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    //this socket is authenticated, we are good to handle more events from it.
    console.log('hello! ' + JSON.stringify(socket.decoded_token));

    if (socket.decoded_token.teacher) {
      users[socket.id] = {
        teacher: socket.decoded_token.teacher,
        name: socket.decoded_token.name,
        quickquiz: ''
      };
      teachers[socket.id] = {
        id: socket.decoded_token.teacher,
        name: socket.decoded_token.name,
        quickquiz: ''
      };
    } else if (socket.decoded_token.student) {
      users[socket.id] = {
        student: socket.decoded_token.student,
        name: socket.decoded_token.name,
        quickquiz: '',
        quizsample: '',
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

            io.of('/quickquiz').to(socket.id).emit('joined');

            if (users[socket.id].teacher) {
              teachers[socket.id].quickquiz = quickquizId;
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
              io.of('/quickquiz').to(socket.id).emit('student list', students);
            } else if (users[socket.id].student) {
              var response = {
                name: users[socket.id].name,
                id: users[socket.id].student
              };
              io.of('/quickquiz').in(quickquizId).emit('student joined', response);
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
      users[socket.id].quizsample = data.quizsampleId;
      var teachers_socket_ids = getTeachersSocketIds(teachers, data.quickquizId);
      io.of('/quickquiz').to(teachers_socket_ids).emit('start doing', users[socket.id]);
    });

    socket.on('finish doing', function (data) {
      users[socket.id].status = 'finish';
      var teachers_socket_ids = getTeachersSocketIds(teachers, data.quickquizId);
      io.of('/quickquiz').to(teachers_socket_ids).emit('finish doing', users[socket.id].student);
    });

    socket.on('student leave', function (data) {
      var teachers_socket_ids = getTeachersSocketIds(teachers, data.quickquizId);
      io.of('/quickquiz').to(teachers_socket_ids).emit('student leaved', users[socket.id].student);
      delete users[socket.id];
    });

    socket.on('question on fill', function (data) {
      var modifiedData = {
        student_id: users[socket.id].student,
        type: data.type,
        answer: data.answer,
        answers: data.answers
      };

      var teachers_socket_ids = getTeachersSocketIds(teachers, data.quickquizId);
      console.log(teachers_socket_ids);
      io.of('/quickquiz').to(teachers_socket_ids).emit('question on fill', modifiedData);
    });

    socket.on('request observe', function (data) {
      var student_id = data.student_id;
      var student_socket_id = getSocketId(users, 'student', student_id);
      var modifiedData = {
        teacher_id: teachers[socket.id].id
      };
      io.of('/quickquiz').to(student_socket_id).emit('request observe', modifiedData);
    });

    socket.on('response observe', function (data) {
      var request_teacher_socket_id = getSocketId(users, 'teacher', data.teacher_id);
      var modifiedData = {
        answers: data.answers
      };
      io.of('/quickquiz').to(request_teacher_socket_id).emit('response observe', modifiedData);
    });

    socket.on('disconnect', function () {

      if (users[socket.id] && users[socket.id].quickquiz !== '' && users[socket.id].student) {
        console.log("student leaved");
        var teachers_socket_ids = getTeachersSocketIds(teachers, users[socket.id].quickquiz);
        io.of('/quickquiz').to(teachers_socket_ids).emit('student leaved', users[socket.id].student);
      } else if (_.has(users[socket.id], 'teacher')) {
        console.log("teacher leaved");
        delete teachers[socket.id]
      }
      socket.disconnect();
      delete users[socket.id];
    });
  });

};

function getSocketId(users, role, id) {
  if (role === 'student') {
    return _.findKey(users, function (user) {
      return user.student === id
    })
  } else if (role === 'teacher') {
    return _.findKey(users, function (user) {
      return user.teacher === id
    })
  }
}

function getTeachersSocketIds(teachers, quickquiz_id) {
  return _.keys(_.pickBy(teachers, function (teacher) {
    return teacher.quickquiz === quickquiz_id
  }))
}

function addStudent(socketId, studentObject) {
  client.hset(["socket:quickquiz:user:" + socketId, "", "some other value"], redis.print);
}
