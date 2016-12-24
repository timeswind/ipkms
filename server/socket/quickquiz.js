var socketioJwt = require('socketio-jwt');
var series = require('async/series');
var _ = require('lodash');
var User = require('../models/user');
var Quickquiz = require('../models/quickquiz');
var Question = require('../models/question');
var redisClient = require('../config/redis_database').redisClient;
var fs = require('fs')
var publicKey = fs.readFileSync('ipkms.rsa.pub');
var QUICKQUIZ_EXPIRATION_SEC =  12 * 60 * 60; // store 12 hours in memory

exports = module.exports = function (io) {

  io.of('/quickquiz')
  .on('connection', socketioJwt.authorize({
    secret: publicKey,
    timeout: 15000
  })).on('authenticated', function(socket) {
    //this socket is authenticated, we are good to handle more events from it.
    var clietns = io.of('/quickquiz').clients();
    let token = socket.decoded_token
    socket.on('user join', function(data) {
      if (_.has(data, 'quickquizId')) {
        console.log('on join')
        socket.join(data.quickquizId);
        io.of('/quickquiz').to(socket.id).emit('joined');
        if (token.role === 'teacher') {
          let redisTeacherIdSocketIdKey = `${data.quickquizId}:tid:socketid` // ${quickquizId}-t
          console.log(socket.id)
          socket.quickquizId = data.quickquizId
          console.log(`teacher id is ${token.id}`)
          console.log(`socket id is ${socket.id}`)
          redisClient.hset(redisTeacherIdSocketIdKey, token.id, socket.id)
          redisClient.expire(redisTeacherIdSocketIdKey, QUICKQUIZ_EXPIRATION_SEC);
          series({
            studentList: function(callback) {
              redisClient.hgetall(`${data.quickquizId}:studentList`, function (err, studentList) {
                if (err) {
                  callback(err)
                } else {
                  callback(null, studentList);
                }
              })
            },
            studentAnswerReports: function(callback){
              redisClient.hgetall(`${data.quickquizId}:sid:report`, function (err, studentAnswerReports) {
                if (err) {
                  callback(err)
                } else {
                  callback(null, studentAnswerReports);
                }
              })
            }
          }, function(err, results) {
            console.log(err)
            if (results) {
              console.log(results)
              io.of('/quickquiz').to(socket.id).emit('studentList', results);
            }
          });
        } else if (token.role === 'student') {
          let redisStudentSocketIdKey = `${data.quickquizId}:sid:socketid` // ${quickquizId}-t
          let redisQuickquizStudentsKey = `${data.quickquizId}:studentList`
          console.log(socket.id)
          socket.quickquizId = data.quickquizId
          console.log(`student id is ${token.id}`)
          console.log(`socket id is ${socket.id}`)
          redisClient.get(`${data.quickquizId}:answer:seeds`, function (err, seeds) {
            if (seeds) {
              io.of('/quickquiz').to(socket.id).emit('seeds', seeds);
            } else {
              addQuickquizSeedsToRedis(data.quickquizId, function (err, seeds) {
                if (err) {

                } else if (seeds) {
                  io.of('/quickquiz').to(socket.id).emit('seeds', seeds);
                }
              })
            }
          })
          redisClient.hset(redisStudentSocketIdKey, token.id, socket.id)
          redisClient.hset(redisQuickquizStudentsKey, token.id, JSON.stringify(token))
          redisClient.expire(redisStudentSocketIdKey, QUICKQUIZ_EXPIRATION_SEC);
          redisClient.expire(redisQuickquizStudentsKey, QUICKQUIZ_EXPIRATION_SEC);
          redisClient.hgetall(`${data.quickquizId}:tid:socketid`, function (error, hashs) {
            if (hashs) {
              var student = {}
              student[token.id] = token
              let teacherSocketIds = _.values(hashs)
              if (teacherSocketIds && teacherSocketIds.length > 0) {
                console.log(teacherSocketIds)
                console.log('emit student join')
                io.of('/quickquiz').to(teacherSocketIds).emit('studentJoin', student);
              }
            }
          })
        }
      } else {
        console.log('missing params')
      }
    })

    socket.on('student answer update', function(data) {
      let student_id = token.id
      let reportJSONString = JSON.stringify(data)
      console.log(socket.quickquizId)
      let redisKey = `${socket.quickquizId}:sid:report`
      console.log(`redisKey is ${redisKey}`)
      redisClient.hset(redisKey, token.id, reportJSONString)
      redisClient.expire(redisKey, QUICKQUIZ_EXPIRATION_SEC)
      getTeachersSocketIds(socket.quickquizId, function (err, ids) {
        if (ids) {
          io.of('/quickquiz').to(ids).emit('studentAnswerReport', {student: token.id, report: data});
        }
      })
    })

    socket.on('disconnect', function() {
      console.log('disconnect')
      console.log(token.id)
      console.log(socket.id)
      if (token.role === 'student') {
        let redisUserIdSocketIdKey = `${socket.quickquizId}:sid:socketid` // ${quickquizId}-t
        let redisQuickquizStudentsKey = `${socket.quickquizId}:studentList`
        redisClient.hdel(redisUserIdSocketIdKey, token.id)
        redisClient.hdel(redisQuickquizStudentsKey, token.id)
        redisClient.hgetall(`${socket.quickquizId}:tid:socketid`, function (error, hashs) {
          if (hashs) {
            let teacherSocketIds = _.values(hashs)
            if (teacherSocketIds && teacherSocketIds.length > 0) {
              io.of('/quickquiz').to(teacherSocketIds).emit('studentLeave', token.id);
            }
          }
        })
      } else if (token.role === 'teacher') {
        let redisKey = `${socket.quickquizId}:tid:socketid` // ${quickquizId}-t
        redisClient.hdel(redisKey, token.id)
      }
    })
  });
};

function addQuickquizSeedsToRedis(quickquiz_id, callback) {
  var populateQuery = [
    {path: "students", select: "name"},
    {path: "samples", select: "student results startTime finishTime"}
  ];
  Quickquiz.findById(quickquiz_id).populate(populateQuery).lean().exec(function (err, quickquiz) {
    if (err) {
      callback(err, null)
    } else {
      if (quickquiz) {
        if (_.has(quickquiz, 'questions') && quickquiz.questions.length > 0) {
          Question.find({'_id': {'$in': quickquiz.questions}}, 'type choices meta tags difficulty').lean().exec(function (err, questions) {
            if (err) {
              callback(err, null)
            } else {
              if (questions) {
                var qidIndexDic = {};
                _.forEach(quickquiz.questions, function (question_id, index) {
                  qidIndexDic[question_id] = index
                });
                for (var i = 0; i < questions.length; i++) {
                  var question_id = questions[i]._id;
                  var index = qidIndexDic[question_id];
                  quickquiz.questions[index] = questions[i]
                }
                var questionsAnswerSeeds = JSON.stringify(quickquiz.questions)
                redisClient.set(`${quickquiz._id}:answer:seeds`, questionsAnswerSeeds);
                redisClient.expire(`${quickquiz._id}:answer:seeds`, QUICKQUIZ_EXPIRATION_SEC);
                callback(null, questionsAnswerSeeds)
              }
            }
          })
        }
      }
    }
  })
}

function getTeachersSocketIds(quickquizId, callback) {
  let teachersRedisKey = `${quickquizId}:tid:socketid`
  redisClient.hgetall(teachersRedisKey, function (error, hashs) {
    if (hashs) {
      callback(null, _.values(hashs))
    } else {
      callback(null, null)
    }
  })
}

function getStudentsSocketIds(studentsRedisKey, callback) {
  redisClient.hgetall(studentsRedisKey, function (error, hashs) {
    if (hashs) {
      callback(null, _.values(hashs))
    } else {
      callback(null, null)
    }
  })
}

function getStudentsAnswers(quickquizAnswersRedisKey, callback) {
  redisClient.hgetall(quickquizAnswersRedisKey, function (error, hashs) {
    if (hashs) {
      callback(null, _.values(hashs))
    } else {
      callback(null, null)
    }
  })
}
