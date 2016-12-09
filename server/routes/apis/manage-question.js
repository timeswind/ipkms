var _ = require('lodash');
var express = require('express');
var router = express.Router();

var User = require('../../models/user');
var Question = require('../../models/question');

var validUser = require('../../auth/validUserRole');
var isTeacher = validUser.isTeacher;
var isLoggedIn = validUser.isLoggedIn;
//创建新题目
router.route('/questions')
.get(isTeacher, function (req, res) {
  var schoolCode = req.user.school
  /**
  * @param {string} req.params.option
  */
  /**
  * @param {string} req.query.sort - sorting by publish date
  */
  /**
  * @param {string} req.query.page - the last question's ID, in order to query the following questions
  */
  if (_.has(req.query, 'option')) {
    var option = req.query.option;
    var sort = -1;
    var page = null;
    if (option === 'mine') {

      if (_.get(req.query, 'sort', false) === '1') {
        sort = 1;
      }

      if (_.has(req.query, 'page')) {
        page = req.query.page;

        if (sort === 1) {
          Question.find({
            createdBy: req.user.id,
            "_id": {$gt: page}
          }, 'content tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        } else {
          Question.find({
            createdBy: req.user.id,
            "_id": {$lt: page}
          }, 'content tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        }
      } else {
        Question.find({createdBy: req.user.id}, 'content tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
          if (err) {
            res.status(500).send(err.message);
          } else {
            res.json(questions);
          }
        });
      }
    } else if (option === 'all') {

      if (_.get(req.query, 'sort', false) === '1') {
        sort = 1;
      }

      if (_.has(req.query, 'page')) {
        page = req.query.page;

        if (sort === 1) {
          Question.find({"school": schoolCode, "_id": {$gt: page}}, 'content tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        } else {
          Question.find({"school": schoolCode, "_id": {$lt: page}}, 'content tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        }

      } else {
        Question.find({"school": schoolCode}, 'content tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
          if (err) {
            res.status(500).send(err.message);
          } else {
            res.json(questions);
          }
        });
      }
    }
  } else {
    res.status(500).send('params missing')
  }
})
.post(isTeacher, function (req, res) {
  /**
  * @param {string} req.body.content
  */
  /**
  * @param {string} req.body.type - question type
  */
  /**
  * @param {string} req.body.subject - subject code / subject name
  */
  /**
  * @param {object} req.body.choices - mc choices, 4 options
  */
  /**
  * @param {array} req.body.tags - tags for the question
  */
  /**
  * @param {number} req.body.difficulty - the difficulty of the question (0 to 5)
  */

  var data = req.body;
  // REQUIRED @params
  var requiredParams = ['content', 'type', 'subject', 'choices', 'tags', 'difficulty'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, data));

  if (paramsComplete && _.isString(data.content)) {
    if (data.type === 'mc') {
      var newQuestion = new Question();
      newQuestion.createdBy = req.user.id;
      newQuestion.school = req.user.school || "pkms";
      newQuestion.content = data.content;
      newQuestion.type = data.type;
      newQuestion.subject = data.subject;
      newQuestion.tags = data.tags;
      newQuestion.difficulty = data.difficulty;
      if (data.choices && data.choices.length !== 0) {
        data.choices.forEach(function(choice){
          newQuestion.choices.push({
            content: choice.content || "",
            clue: choice.clue || "",
            correct: choice.correct || ""
          })
        })
      }
      if (data.images && data.images.length !== 0) {
        data.images.forEach(function(imageData){
          newQuestion.images.push({
            type: imageData.type || "",
            data: imageData.data || "",
            label: imageData.label || ""
          })
        })
      }
      newQuestion.save(function (err, question) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(question)
        }
      });
    } else {
      res.status(400).send('question type not support !')
    }
  } else {
    res.status(500).send('params missing');
  }
});

router.route('/question/:question_id') //get question's detail without answer
.get(isLoggedIn, function (req, res) {
  /**
  * @param {string} req.params.question_id - Question ID
  */
  if (_.has(req.params, 'question_id')) {
    var question_id = req.params.question_id;
    var selectFields = 'content type images tags subject difficulty choices';
    if (req.user.role === 'teacher') {
      selectFields = 'content type createdBy images tags subject difficulty choices updated_at'
    }
    Question.findById(question_id, selectFields).lean().exec(function (err, question) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (question.createdBy == req.user.id) {
          question.createdBy = 'self';
          res.json(question)
        } else {
          User.findById(question.createdBy, 'name').lean().exec(function (err, user) {
            if (err) {
              res.json(question)
            } else {
              if (_.has(user, 'name')) {
                question.createdBy = user.name;
                res.json(question);
              } else {
                res.json(question)
              }
            }
          })
        }
      }
    });
  } else {
    res.status(400);
  }
})
.put(isTeacher, function (req, res) {
  /**
  * @param {string} req.params.question_id - Question ID
  */
  /**
  * @param {string} req.body.subject
  */
  /**
  * @param {string} req.body.difficulty
  */
  /**
  * @param {string} req.body.tags
  */
  /**
  * @param {object} req.body.choices
  */
  var requiredParams = ['subject', 'difficulty', 'tags', 'choices'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));
  if (_.has(req.params, 'question_id') && paramsComplete && _.isNumber(req.body.difficulty) && _.isArray(req.body.tags) && _.isArray(req.body.choices)) {
    let question_id = req.params.question_id
    var updateData = {
      subject: req.body.subject,
      difficulty: req.body.difficulty,
      tags: req.body.tags,
      choices: req.body.choices,
      updated_at: new Date()
    };

    Question.findOne({_id: question_id}, function(err, question) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (question.createdBy == req.user.id) {
          let choiceRequiredKeys = ['_id', 'content', 'clue', 'correct']
          var choicesValid = true
          var correctAnswerCount = 0
          req.body.choices.forEach((choice) => {
            if (_.every(choiceRequiredKeys, _.partial(_.has, choice)) && _.isBoolean(choice.correct)) {
              if (choice.correct === true) {
                correctAnswerCount++
              }
            } else {
              choicesValid = false
            }
          })
          console.log('correctAnswerCount=' + correctAnswerCount)
          console.log('choicesValid=' + choicesValid)
          if (correctAnswerCount === 0) {
            res.status(400).json({success: false, message: 'At least one answer should be correct'});
          } else if (!choicesValid) {
            res.status(400).json({success: false, message: 'Choices objects invalid'});
          } else {
            question.subject = req.body.subject,
            question.difficulty = req.body.difficulty,
            question.tags = req.body.tags,
            question.choices = req.body.choices,
            question.updated_at = new Date()
            question.save(function(err) {
              if (err) {
                res.status(500).send(err.message);
              } else {
                res.json({success: true});
              }
            })
          }
        } else {
          res.status(401).send('permission denied')
        }
      }
    })

  } else {
    res.status(400).send('params invalid')
  }
})
.delete(isTeacher, function (req, res) {
  /**
  * @param {string} req.params.question_id - Question ID
  */
  if (_.has(req.params, 'question_id')) {
    Question.findById(req.params.question_id, 'createdBy', function (err, q) {
      if (q.createdBy == req.user.id) {

        q.remove(function (err) {
          if (err) {
            res.status(500).send(err.message)
          } else {
            res.send('deleted')
          }
        });

      } else {
        res.status(401).send('Permission denied');
      }
    })
  } else {
    res.status(400);
  }
});

//获取题目的答案
router.route('/answer')
.get(isTeacher, function (req, res) {
  /**
  * @param {string} req.query.question_id - Question ID
  */
  if (_.has(req.query, 'question_id')) {
    Question.findById(req.query.question_id).lean().exec(function (err, question) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (_.has(question, 'answer')) {
          res.json(question.answer);
        } else {
          res.send('look up answer failed')
        }
      }
    });
  } else {
    res.status(400);
  }
});

//根据标签进行搜索题目
router.route('/query')
.post(isTeacher, function (req, res) {
  let school = req.user.school || "pkms"
  /**
  * @param {array} req.body.tags - array of tags which used to query the questions that has the tags
  */
  /**
  * @param {array} req.body.difficulty -  { min: , max: }
  */
  /**
  * @param {string} req.body.content
  */
  /**
  * @param {string} req.body.options
  */
  var checkParams = _.has(req.body, 'tags') && _.isArray(req.body.tags) && _.has(req.body, 'difficulty.min') && _.has(req.body, 'difficulty.max') && _.inRange(req.body.difficulty.min, 1, 6) && _.inRange(req.body.difficulty.max, 1, 6);
  if (checkParams) {

    var tags = req.body.tags;
    var difficulty = [];

    for (var i = req.body.difficulty.min; i < (req.body.difficulty.max + 1); i++) {
      difficulty.push(i)
    }

    if (_.get(req.body, 'options.matchAny', false)) {
      Question.find({$or: [{tags: {$in: tags}}, {difficulty: {$in: difficulty}}], school: school}, 'content tags subject difficulty type').lean().exec(function (err, questions) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(questions);
        }
      });
    } else {
      Question.find({$and: [{tags: {$in: tags}}, {difficulty: {$in: difficulty}}], school: school}, 'content tags subject difficulty type').lean().exec(function (err, questions) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(questions);
        }
      });
    }
  } else {
    res.status(400).send('bad params')
  }
});

module.exports = router;
