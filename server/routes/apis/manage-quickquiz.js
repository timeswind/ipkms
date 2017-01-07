"use strict";
var _ = require('lodash');
var async = require('async');
var express = require('express');
var router = express.Router();
var QUICKQUIZ_EXPIRATION_SEC =  12 * 60 * 60; // store 12 hours in memory

var Question = require('../../models/question');
var Quickquiz = require('../../models/quickquiz');
var Quizsample = require('../../models/quizsample');
var Qcollection = require('../../models/qcollection');

var validUser = require('../../auth/validUserRole');
var isTeacher = validUser.isTeacher;
var isStudent = validUser.isStudent;
var isLoggedIn = validUser.isLoggedIn;

var redisClient = require('../../config/redis_database').redisClient;
var scoreQuiz = require('../../modules/score-quiz');

router.route('/teacher/quickquizs')
.get(isTeacher, function (req, res) {
  var user_id = req.user.id;
  var sort = -1;

  if (_.get(req.query, 'sort', false) === '0') {
    sort = 1;
  }

  if (_.has(req.query, 'page')) {
    var page = req.query.page;

    if (sort === 1) {
      Quickquiz.find({
        createdBy: user_id,
        "_id": {$gt: page}
      }, 'title finished duration startAt endAt').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
        if (err) {
          res.status(500).send(err.message)
        } else {
          res.json(quickquizs)
        }
      })
    } else {
      Quickquiz.find({
        createdBy: user_id,
        "_id": {$lt: page}
      }, 'title finished duration startAt endAt').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
        if (err) {
          res.status(500).send(err.message)
        } else {
          res.json(quickquizs)
        }
      })
    }

  } else {
    Quickquiz.find({createdBy: user_id}, 'title finished duration startAt endAt').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json(quickquizs)
      }
    })
  }
})
.post(isTeacher, function (req, res) {
  let user_id = req.user.id;
  let school = req.user.school;

  var requiredParams = ['title', 'time', 'qcollection_id', 'subject'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));

  if (paramsComplete) {
    if (req.body.title.trim() !== '' && req.body.time > 0) {

      let title = req.body.title;
      let duration = req.body.time;
      let qcollection_id = req.body.qcollection_id;
      let subject = req.body.subject;

      async.waterfall([
        function (callback) {
          Qcollection.findById(qcollection_id, function (err, Qcollection) {
            if (err) {
              callback(err);
            } else {
              let questionIdArray = Qcollection.questions;
              callback(null, questionIdArray);
            }
          });
        },
        function (questionIdArray, callback) {
          var newQuickquiz = new Quickquiz();
          newQuickquiz.title = title;
          newQuickquiz.createdBy = user_id;
          newQuickquiz.school = school;
          newQuickquiz.subject = subject;
          newQuickquiz.duration = duration;
          newQuickquiz.questions = questionIdArray;
          newQuickquiz.startAt = new Date();

          newQuickquiz.save(function (err, quickquiz) {
            if (err) {
              callback(err);
            } else {
              callback(null, quickquiz)
            }
          });
        },
        function (quickquiz, callback) {
          Question.find({'_id': {'$in': quickquiz.questions}}, 'type choices meta tags difficulty').lean().exec(function (err, questions) {
            if (err) {
              callback(err)
            } else if (questions) {
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
              callback(null, quickquiz)
            }
          })
        }
      ], function (err, result) {
        if (err) {
          res.status(500).send(err.message);
        } else if (result) {
          res.json({success: true, id: result.id});
        }
      });

    } else {
      res.status(400)
    }
  } else {
    res.status(400)
  }
})

router.route('/teacher/quickquiz/:id')
.get(isTeacher, function (req, res) {
  if (_.has(req.params, 'id')) {
    var quickquiz_id = req.params.id;
    async.series({
      quickquiz: function(callback) {
        getQuickquizFromCache(quickquiz_id, function(err, quickquiz) {
          if (err) {
            callback(err);
          } else {
            callback(null, quickquiz);
          }
        })
      },
      quizsamples: function(callback) {
        Quizsample.find({quickquiz: quickquiz_id}).populate('student', 'name').lean().exec(function(err, quizsamples) {
          if (err) {
            callback(err);
          } else {
            callback(null, quizsamples);
          }
        })
      },
    }, function(err, results) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        results['success'] = true
        res.json(results);
      }
    });
  } else {
    res.status(403).send('params missing')
  }
});

router.route('/teacher/quizsample')
.get(isTeacher, function (req, res) {
  if (_.has(req.query, 'id')) {
    var quizsample_id = req.query.id;
    var populateQuery = [
      {path: "student", select: "name schoolId"}
    ];
    Quizsample.findById(quizsample_id).populate(populateQuery).lean().exec(function (err, quizsample) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json(quizsample)
      }
    })
  } else {
    res.status(403).send('params missing')
  }
});

router.route('/teacher/end')
.post(isTeacher, function (req, res) {
  /**
  * @param {string} req.body.quickquiz_id
  */
  var user_id = req.user.id;
  var quickquiz_id = req.body.quickquiz_id
  async.waterfall([
    function (callback) {
      if (_.has(req.body, 'quickquiz_id')) {
        Quickquiz.findById(quickquiz_id).exec(function (err, quickquiz) {
          if (err) {
            callback(err)
          } else {
            if (quickquiz && !_.has(quickquiz, 'endAt') && quickquiz.createdBy == user_id) {
              callback(null, quickquiz)
            } else {
              callback({message: 'quickquiz has not finish or permission denied'});
            }
          }
        })
      } else {
        callback({message: 'params missing'});
      }
    },
    function (quickquiz, callback) {
      quickquiz.endAt = new Date()
      quickquiz.save(function(err) {
        if (err) {
          callback(err)
        } else {
          callback(null, {success: true})
        }
      })
    }
  ], function (err, result) {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.send(result)
    }
  });
});

router.route('/student/quickquiz/start')
.post(isStudent, function (req, res) {
  /**
  * @param {string} req.body.quickquiz_id
  */
  if (_.has(req.body, 'quickquiz_id')) {
    var quickquiz_id = req.body.quickquiz_id;
    var student_id = req.user.student;
    Quizsample.count({quickquiz: quickquiz_id, student: student_id}, function (err, count) {
      if (err) {
        callback(err)
      } else {
        if (count === 0) {
          var newQuizsample = new Quizsample();
          newQuizsample.quickquiz = quickquiz_id;
          newQuizsample.student = student_id;
          newQuizsample.startTime = new Date();
          newQuizsample.save(function (err, sample) {
            if (err) {
              res.status(500).send(err.message)
            } else {
              Quickquiz.findByIdAndUpdate(quickquiz_id, {$addToSet: {samples: sample}}, function (err) {
                if (err) {
                  res.status(500).send(err.message)
                } else {
                  res.send(sample._id)
                }
              });
            }
          });
        } else {
          res.send('restart quickquiz')
        }
      }
    });


  } else {
    res.status(400).send('params missing')
  }
});


router.route('/student/quickquiz/questions')
.get(isStudent, function (req, res) {
  if (req.query && req.query.id) {
    var quickquiz_id = req.query.id;
    var student_id = req.user.student;

    Quickquiz.findById(quickquiz_id, 'title duration questions students createdBy finished').populate(populateQuery).lean().exec(function (err, quickquiz) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        if (JSON.parse(JSON.stringify(quickquiz.students)).indexOf(student_id) > -1 && _.has(quickquiz, 'questions')) {
          delete quickquiz.students;

          var selectFields = 'context delta type choices';

          if (_.get(quickquiz, 'finished', false)) {
            selectFields = 'context delta type choices answer'
          }
          Question.find({"_id": {"$in": quickquiz.questions}}, selectFields).lean().exec(function (err, questions) {
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
              quickquiz.reqRole = 'student';
              res.json({success: true, quickquiz: quickquiz})

            } else {
              res.json({success: true, quickquiz: quickquiz})
            }
          })
        } else {
          res.status(403).send('permission denied')
        }
      }
    })

  } else {
    res.status(403).send('params wrong')
  }

});

router.route('/quickquiz')
.get(isLoggedIn, function (req, res) {
  var user_id = req.user.id;
  var quickquiz_id = req.query.id;
  if (_.has(req.query, 'id')) {
    if (req.user.role === 'student') {
      async.waterfall([
        function (callback) {
          Quizsample.findOne({ quickquiz: quickquiz_id, student: user_id }).lean().exec(function (err, quizsample) {
            if (err) {
              callback(err)
            } else {
              if (quizsample && quizsample.finishAt) {
                console.log('quizsample find')
                callback(null, quizsample)
              } else {
                if (!quizsample) {
                  var newQuizsample = new Quizsample()
                  newQuizsample.quickquiz = quickquiz_id;
                  newQuizsample.student = user_id;
                  newQuizsample.save();
                }
                callback(null, null)
              }
            }
          });
        },
        function(quizsample, callback) {
          getQuickquizDataForStudentFromRedis(quickquiz_id, function(err, quickquiz) {
            if (err) { callback(err) } else {
              var results = {
                success: true,
                quickquiz: quickquiz
              }
              console.log(quizsample)
              if (quizsample && quizsample.finishAt) {
                results['quizsample'] = quizsample
                results['handin'] = true
              }
              callback(null, results)
            }
          })
        }
      ], function (err, results) {
        if (err) {
          res.status(500).json(err.message)
        } else {
          res.json(results)
        }
      })
    } else if (req.user.role === 'teacher') {
      Quickquiz.findById(quickquiz_id, 'title duration questions startAt endAt').lean().exec(function (err, quickquiz) {
        if (err) {
          res.status(500).send(err.message)
        } else if (quickquiz && _.has(quickquiz, 'questions')) {
          Question.find({"_id": {"$in": quickquiz.questions}}, 'content type choices meta').lean().exec(function (err, questions) {
            if (questions) {
              var qidIndexDic = {}
              _.forEach(quickquiz.questions, function (question_id, index) {
                qidIndexDic[question_id] = index
              });
              for (var i = 0; i < questions.length; i++) {
                var question_id = questions[i]._id
                var index = qidIndexDic[question_id]
                quickquiz.questions[index] = questions[i]
              }
              res.json({success: true, quickquiz: quickquiz})
            } else {
              res.json({success: true, quickquiz: quickquiz})
            }
          })
        } else {
          res.status(404).send('not found')
        }
      })
    }
  } else {
    res.status(403).send('params wrong')
  }
})
.delete(isTeacher, function (req, res) {
  var checkParams = _.has(req.body, 'quickquiz_id');
  if (checkParams) {
    let quickquiz_id = req.body.quickquiz_id;
    Quickquiz.findOne({'_id': quickquiz_id}, function (err, quickquiz) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        if (quickquiz.createdBy == req.user.teacher) {
          quickquiz.remove(function (err) {
            if (err) {
              res.status(500).send(err.message)
            } else {
              res.send('success')
            }
          })
        } else {
          res.status(400).send('permission denied')
        }
      }
    })
  }
});

router.route('/student/handin')
.post(isStudent, function (req, res) {
  /**
  * @param {string} req.body.id - Quickquiz Unique ID
  */
  /**
  * @param {array} req.body.answers - student's answer to questions in same order as question set
  */
  if (_.every(['id', 'answers'], _.partial(_.has, req.body)) && _.isArray(req.body.answers)) {
    var quickquiz_id = req.body.id;
    var studentAnswers = req.body.answers;
    var student_id = req.user.id;
    var studentQuizSample = null
    async.waterfall([
      function (callback) {
        Quizsample.findOne({
          quickquiz: quickquiz_id,
          student: student_id
        }).exec(function (err, quizsample) {
          if (err) {
            callback(err)
          } else {
            if (quizsample) {
              if (_.has(quizsample, 'finishAt')) {
                callback({message: 'already handed in'})
              } else {
                studentQuizSample = quizsample
                callback(null)
              }
            } else {
              callback({message: 'can not find quizsample'})
            }
          }
        });
      },
      function (callback) {
        getQuickquizFromCache(quickquiz_id, function(err, quickquiz) {
          if (err) {
            callback(err)
          } else {
            var questions = quickquiz.questions
            var mapQuestions = {}
            questions.forEach((question) => {
              if (question && question._id) {
                mapQuestions[question._id] = question
              } else {
                mapQuestions[question] = null
              }
            })
            callback(null, mapQuestions, quickquiz)
          }
        })
      },
      function (mapQuestions, quickquiz, callback) {
        scoreQuiz(mapQuestions, studentAnswers, quickquiz, function (err, results) {
          if (err) {
            callback(err)
          } else {
            callback(null, results)
          }
        })
      },
      function (results, callback) {
        console.log(results)
        studentQuizSample.finishAt = new Date()
        if (results.score) {
          studentQuizSample.score = results.score
        }
        if (results.checkAnswersReports && results.checkAnswersReports.length > 0) {
          results.checkAnswersReports.forEach((answer) => {
            studentQuizSample.answers.push({
              key: answer.key,
              data: answer.data,
              correct: answer.correct,
              blank: answer.blank,
              exception: answer.exception
            })
          })
        }
        if (results.report && results.report.length > 0) {
          results.report.forEach((data) => {
            studentQuizSample.report.push({
              key: data.key,
              data: data.data
            })
          })
        }
        studentQuizSample.save(function(err, sample) {
          if (err) { callback(err) } else {
            callback(null, sample)
          }
        })
      }
    ], function (err, quizsample) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json({
          success: true,
          quizsample: quizsample
        });
      }
    });


  } else {
    res.status(403)
  }
})

router.route('/student/quickquizs')
.get(isStudent, function (req, res) {
  var user_id = req.user.id;
  var populateQuery = [
    {path: "quickquiz", select: "title startAt endAt time"}
  ];

  if (_.has(req.query, 'page')) {
    var page = req.query.page;
    Quizsample.find({"student": user_id, "_id": {$gt: page}}, "quickquiz right wrong blank exception").populate(populateQuery).sort({_id: -1}).limit(10).lean().exec(function (err, quizsamples) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json(quizsamples)
      }
    });
  } else {
    Quizsample.find({"student": user_id}, "quickquiz right wrong blank exception").populate(populateQuery).sort({_id: -1}).limit(10).lean().exec(function (err, quizsamples) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        var filteredSamples = _.filter(quizsamples, function (quizsample) {
          return quizsample.quickquiz !== null
        })
        res.json({success: true, quizsamples: filteredSamples})
      }
    });
  }
});

module.exports = router;

function getQuickquizDataForStudentFromRedis(quickquiz_id, callback) {
  redisClient.get(`${quickquiz_id}:quickquiz:s`, function (err, quickquiz) {
    if (err) {
      callback(err)
    } else {
      if (quickquiz) {
        let quickquizData = JSON.parse(quickquiz)
        callback(null, quickquizData)
      } else {
        Quickquiz.findOne({_id: quickquiz_id}, 'title endAt duration questions').lean().exec(function (err, quickquiz) {
          if (err) {
            callback(err)
          } else {
            if (quickquiz) {
              Question.find({"_id": {"$in": quickquiz.questions}}, 'content type choices randomize meta').lean().exec(function (err, questions) {
                if (questions) {
                  var qidIndexDic = {};
                  _.forEach(quickquiz.questions, function (question_id, index) {
                    qidIndexDic[question_id] = index
                  });
                  for (var i = 0; i < questions.length; i++) {
                    // if (questions[i].type === 'mc' && questions[i].choices) {
                    //   questions[i].choices = questions[i].choices.map((choice) => {
                    //     var modifiedChoiceObj = {}
                    //     modifiedChoiceObj['_id'] = choice['_id']
                    //     modifiedChoiceObj['content'] = choice['content']
                    //     return modifiedChoiceObj
                    //   })
                    //   console.log(questions[i].choices)
                    // }
                    var question_id = questions[i]._id;
                    var index = qidIndexDic[question_id];
                    quickquiz.questions[index] = questions[i]
                  }
                  redisClient.set(`${quickquiz_id}:quickquiz:s`, JSON.stringify(quickquiz))
                  redisClient.expire(`${quickquiz_id}:quickquiz:s`, QUICKQUIZ_EXPIRATION_SEC)
                  callback(null, quickquiz)
                } else {
                  redisClient.set(`${quickquiz_id}:quickquiz:s`, JSON.stringify(quickquiz))
                  redisClient.expire(`${quickquiz_id}:quickquiz:s`, QUICKQUIZ_EXPIRATION_SEC)
                  callback(null, quickquiz)
                }
              })
            } else {
              callback( new Error("Quickquiz not found"))
            }
          }
        })
      }
    }
  })
}

function getQuickquizQuestionsSeeds (quickquiz_id, callback) {
  redisClient.get(`${quickquiz_id}:answer:seeds`, function(err, seeds) {
    if (!seeds) {
      Quickquiz.findById(quickquiz_id).lean().exec(function (err, quickquiz) {
        if (err) {
          callback(err)
        } else {
          if (quickquiz) {
            if (quickquiz.questions && quickquiz.questions.length > 0) {
              Question.find({'_id': {'$in': quickquiz.questions}}, 'type choices meta tags difficulty').lean().exec(function (err, questions) {
                if (err) {
                  callback(err)
                } else if (questions) {
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
                  redisClient.set(`${quickquiz_id}:answer:seeds`, questionsAnswerSeeds);
                  redisClient.expire(`${quickquiz_id}:answer:seeds`, QUICKQUIZ_EXPIRATION_SEC);
                  callback(null, quickquiz.questions)
                }
              })
            } else {
              callback({message: 'quiz questions found'})
            }
          } else {
            callback({message: 'quiz not found'})
          }
        }
      })
    } else {
      let questions = JSON.parse(seeds)
      callback(null, questions)
    }
  })
}

function getQuickquizFromCache (quickquiz_id, callback) {
  redisClient.get(`${quickquiz_id}:cache`, function(err, quickquiz) {
    if (!quickquiz) {
      Quickquiz.findById(quickquiz_id).lean().exec(function (err, quickquiz) {
        if (err) {
          callback(err)
        } else {
          if (quickquiz) {
            if (quickquiz.questions && quickquiz.questions.length > 0) {
              Question.find({'_id': {'$in': quickquiz.questions}}, 'type choices meta tags difficulty').lean().exec(function (err, questions) {
                if (err) {
                  callback(err)
                } else if (questions) {
                  var qidIndexDic = {};
                  _.forEach(quickquiz.questions, function (question_id, index) {
                    qidIndexDic[question_id] = index
                  });
                  for (var i = 0; i < questions.length; i++) {
                    var question_id = questions[i]._id;
                    var index = qidIndexDic[question_id];
                    quickquiz.questions[index] = questions[i]
                  }
                  var quickquizCache = JSON.stringify(quickquiz)
                  redisClient.set(`${quickquiz_id}:cache`, quickquizCache);
                  redisClient.expire(`${quickquiz_id}:cache`, QUICKQUIZ_EXPIRATION_SEC);
                  callback(null, quickquiz)
                }
              })
            } else {
              var quickquizCache = JSON.stringify(quickquiz)
              redisClient.set(`${quickquiz_id}:cache`, quickquizCache);
              redisClient.expire(`${quickquiz_id}:cache`, QUICKQUIZ_EXPIRATION_SEC);
              callback(null, quickquiz)
            }
          } else {
            callback({message: 'quiz not found'})
          }
        }
      })
    } else {
      let parsedQuickquiz = JSON.parse(quickquiz)
      callback(null, parsedQuickquiz)
    }
  })
}
