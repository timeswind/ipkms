"use strict";
var _ = require('lodash');
var async = require('async');
var express = require('express');
var router = express.Router();
var QUICKQUIZ_EXPIRATION_SEC =  12 * 60 * 60; // store 12 hours in memory
// var raven = require('raven');

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
      }, 'title finished duration startTime finishTime').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
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
      }, 'title finished duration startTime finishTime').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
        if (err) {
          res.status(500).send(err.message)
        } else {
          res.json(quickquizs)
        }
      })
    }

  } else {
    Quickquiz.find({createdBy: user_id}, 'title finished duration startTime finishTime').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
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
    var populateQuery = [
      {path: "students", select: "name"},
      {path: "samples", select: "student results startTime finishTime"}
    ];
    Quickquiz.findById(quickquiz_id).populate(populateQuery).lean().exec(function (err, quickquiz) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        if (quickquiz) {
          if (quickquiz.questions && quickquiz.questions.length > 0) {
            Question.find({'_id': {'$in': quickquiz.questions}}, 'type choices meta tags difficulty').lean().exec(function (err, questions) {
              if (err) {
                res.status(500).send(err.message)
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
                if (!_.has(quickquiz, 'endAt')) {
                  var questionsAnswerSeeds = JSON.stringify(quickquiz.questions)
                  redisClient.get(`${quickquiz._id}:answer:seeds`, function(err, seeds) {
                    if (!seeds) {
                      redisClient.set(`${quickquiz._id}:answer:seeds`, questionsAnswerSeeds);
                      redisClient.expire(`${quickquiz._id}:answer:seeds`, QUICKQUIZ_EXPIRATION_SEC);
                    } else {
                      redisClient.expire(`${quickquiz._id}:answer:seeds`, QUICKQUIZ_EXPIRATION_SEC);
                    }
                  })
                }
                res.json({success: true, quickquiz: quickquiz})
              }
            })
          } else {
            res.status(404).json({success: false, message: 'quiz questions found'})
          }
        } else {
          res.status(404).json({success: false, message: 'quiz not found'})
        }
      }
    })
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

router.route('/teacher/end-quickquiz')
.post(isTeacher, function (req, res) {
  /**
  * @param {string} req.body.quickquiz_id
  */
  var user_id = req.user.id;

  async.waterfall([
    function (callback) {
      if (_.has(req.body, 'quickquiz_id')) {
        Quickquiz.findById(req.body.quickquiz_id).lean().exec(function (err, quickquiz) {
          if (err) {
            callback(err)
          } else {
            if (!_.get(quickquiz, 'finished', true) && _.get(quickquiz, 'createdBy', null) == user_id) {
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
      var analysis = {
        quickquiz_id: quickquiz._id,
        aveRight: 0,
        aveTime: 0,
        rank: [],
        finishTime: new Date()
      };
      Quizsample.find({"_id": {'$in': _.get(quickquiz, 'samples', [])}}).lean().exec(function (err, quizSamples) {
        if (quizSamples && quizSamples.length > 0) {
          var totalCorrectCount = 0;
          var totalTimeCost = 0; //in millisecond

          analysis.rank = _(quizSamples).chain()
          .map(function (sample) {
            var id = sample._id;
            var timeCost = null;
            var rightCount = sample.results.right.length;
            totalCorrectCount += rightCount;

            if (_.has(sample, 'startTime') && _.has(sample, 'finishTime')) {
              timeCost = Math.abs(sample.startTime - sample.finishTime);
              totalTimeCost += timeCost
            }

            return {id: id, score: rightCount, timeCost: timeCost}
          })
          .sortBy('score')
          .reverse();

          var aveCorrectCount = 0, aveTimeCost = 0;

          if (totalTimeCost > 0) {
            aveTimeCost = totalTimeCost / quizSamples.length;
          }

          if (totalCorrectCount > 0) {
            aveCorrectCount = totalCorrectCount / quizSamples.length;
          }

          console.log('aveCorrectCount --> ' + aveCorrectCount);
          console.log('aveTimeCost --> ' + aveTimeCost);

          analysis.aveRight = aveCorrectCount;
          analysis.aveTime = aveTimeCost;
          callback(null, analysis)
        } else {
          analysis.aveRight = 0;
          analysis.aveTime = 0;
          callback(null, analysis)
        }

      });
    },
    function (analysis, callback) {
      Quickquiz.findOneAndUpdate({'_id': analysis.quickquiz_id},
      {
        $set: {
          'finished': true,
          'finishTime': analysis.finishTime,
          'analysis.rank': analysis.rank,
          'analysis.aveRight': analysis.aveRight,
          'analysis.aveTime': analysis.aveTime
        }
      }, function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null, 'success')
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

    var populateQuery = [
      {path: "createdBy", select: "name"}
    ];

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
              if (quizsample && quizsample.finished) {
                results['quizsample'] = quizsample
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
              res.json(quickquiz)
            } else {
              res.status(400).json(quickquiz)
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
      // function (callback) {
      //   Quizsample.findOne({
      //     quickquiz: quickquiz_id,
      //     student: student_id
      //   }).lean().exec(function (err, quizsample) {
      //     if (err) {
      //       callback(err)
      //     } else {
      //       if (quizsample) {
      //         if (_.has(quizsample, 'finishAt')) {
      //           callback({message: 'already handed in'})
      //         } else {
      //           callback(null)
      //         }
      //       } else {
      //         callback({message: 'already handed in'})
      //         res.status(500).send('can not find quizsample')
      //       }
      //     }
      //   });
      // },
      function (callback) {
        Quickquiz.findById(quickquiz_id, 'questions').lean().exec(function (err, quickquiz) {
          if (err) {
            callback(err)
          } else {
            if (quickquiz) {
              if (_.has(quickquiz, 'questions') && quickquiz.questions.length > 0) {
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
                    callback(null, quickquiz.questions)
                  }
                })
              } else {
                callback({message: 'missing questions key on quickquiz object'})
              }
            } else {
              callback({message: 'Quickquiz not found'})
            }
          }
        });
      },
      function (questions, callback) {
        var mapQuestions = {}
        questions.forEach((question) => {
          if (question && question._id) {
            mapQuestions[question._id] = question
          } else {
            mapQuestions[question] = null
          }
        })
        scoreQuiz(mapQuestions, studentAnswers, function (err, results) {
          if (err) {
            callback(err)
          } else {
            callback(null, results)
          }
        })
      },
      function (results, callback) {
        console.log(results)
        callback({message: 'test'})
      }
    ], function (err, checkAnswersRestults) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json({
          status: 'success',
          results: checkAnswersRestults
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
                    if (questions[i].type === 'mc' && questions[i].choices) {
                      questions[i].choices = questions[i].choices.map((choice) => {
                        var modifiedChoiceObj = {}
                        modifiedChoiceObj['_id'] = choice['_id']
                        modifiedChoiceObj['content'] = choice['content']
                        return modifiedChoiceObj
                      })
                      console.log(questions[i].choices)
                    }
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
