var _ = require('lodash');
var express = require('express');
var router = express.Router();

var User = require('../../models/localuser');
var Question = require('../../models/question');

var validUser = require('../../auth/validUserRole');
var isTeacher = validUser.isTeacher;
var isLoggedIn = validUser.isLoggedIn;
//创建新题目
router.route('/questions')
.get(isTeacher, function (req, res) {
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
          }, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
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
          }, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        }
      } else {
        Question.find({createdBy: req.user.id}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
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
          Question.find({"_id": {$gt: page}}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        } else {
          Question.find({"_id": {$lt: page}}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
            if (err) {
              res.status(500).send(err.message);
            } else {
              res.json(questions);
            }
          });
        }

      } else {
        Question.find({}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
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
  * @param {string} req.body.type - question type
  */
  /**
  * @param {string} req.body.subject - subject code / subject name
  */
  /**
  * @param {string} req.body.context - question body
  */
  /**
  * @param {array} req.body.subject - mc choices, 4 options
  */
  /**
  * @param {number} req.body.answer - right choice index (0, 1 ,2, 3)
  */
  /**
  * @param {array} req.body.tags - tags for the question
  */
  /**
  * @param {number} req.body.difficulty - the difficulty of the question (0 to 5)
  */
  /**
  * @param {string} req.body.delta
  */

  var data = req.body;
  // REQUIRED @params
  var requiredParams = ['language', 'type', 'subject', 'context', 'choices', 'answer', 'tags', 'difficulty', 'delta'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, data));

  if (paramsComplete && _.isNumber(data.difficulty) && _.isString(data.type)) {
    if (data.type === 'mc' && _.has(data, 'answer.mc')) {
      var newQuestion = new Question();

      newQuestion.createdBy = req.user.id;
      newQuestion.type = data.type;
      newQuestion.subject = data.subject;
      newQuestion.context = data.context;
      newQuestion.choices = data.choices;
      newQuestion.answer.mc = data.answer.mc;
      newQuestion.tags = data.tags;
      newQuestion.difficulty = data.difficulty;
      newQuestion.delta = data.delta;
      newQuestion.language = data.language;
      newQuestion.statistic.mc = [0, 0, 0, 0];

      newQuestion.answer.fill = undefined;
      newQuestion.statistic.fill = undefined;

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

router.route('/draft')
.post(isTeacher, function (req, res) {
  var data = req.body;
  // REQUIRED @params
  var requiredParams = ['language', 'type', 'subject', 'context', 'choices', 'answer', 'tags', 'difficulty', 'rawData'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, data));

  if (paramsComplete && _.isNumber(data.difficulty) && _.isString(data.type)) {
    if (data.type === 'mc' && _.has(data, 'answer.mc')) {
      var newQuestion = new Question();

      newQuestion.createdBy = req.user.id;
      newQuestion.type = data.type;
      newQuestion.subject = data.subject;
      newQuestion.context = data.context;
      newQuestion.choices = data.choices;
      newQuestion.answer.mc = data.answer.mc;
      newQuestion.tags = data.tags;
      newQuestion.difficulty = data.difficulty;
      newQuestion.rawData = data.rawData;
      newQuestion.language = data.language;
      newQuestion.statistic.mc = [0, 0, 0, 0];
      newQuestion.draft = true;

      newQuestion.answer.fill = undefined;
      newQuestion.statistic.fill = undefined;

      if (_.has(data, 'images') && _.isArray(data.images) && data.images.length > 0) {
        _.forEach(data.images, function (image) {
          var requiredImageParams = ['type', 'label', 'data'];
          var imageParamsComplete = _.every(requiredImageParams, _.partial(_.has, image));
          if (imageParamsComplete) {
            var formatImageData = {
              type: image.type,
              label: image.label,
              data: image.label
            }
            newQuestion.images.push(formatImageData)
          }
        })
      }
      newQuestion.save(function (err, question) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.send('draft saved')
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
    var selectFields = 'type context tags subject difficulty choices';
    if (_.has(req.user, 'teacher')) {
      selectFields = 'type createdBy context tags subject difficulty choices updated_at statistic answer rawData'
    }
    Question.findById(question_id, selectFields).lean().exec(function (err, question) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (question.createdBy == req.user.id) {
          question.createdBy = 'self';
          res.json(question)
        } else {
          User.findById(question.createdBy, 'local.name').lean().exec(function (err, user) {
            if (err) {
              res.json(question)
            } else {
              if (_.has(user, 'local.name')) {
                question.createdBy = user.local.name;
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
  * @param {object} req.body.answer
  */
  var requiredParams = ['subject', 'difficulty', 'tags', 'answer'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));
  if (_.has(req.params, 'question_id') && paramsComplete && _.isNumber(req.body.difficulty) && _.isArray(req.body.tags)) {

    var updateData = {
      subject: req.body.subject,
      difficulty: req.body.difficulty,
      tags: req.body.tags,
      answer: req.body.answer,
      updated_at: new Date()
    };

    Question.findOneAndUpdate({_id: req.params.question_id}, {$set: updateData}, {user_id: req.user.id}, function (err) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json('success');
      }
    });

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

//获取用户自己创建的题目
router.route('/mine')
.get(isTeacher, function (req, res) {
  /**
  * @param {string} req.query.sort - sorting by publish date
  */
  /**
  * @param {string} req.query.page - the last question's ID, in order to query the following questions
  */
  var sort = -1;

  if (_.get(req.query, 'sort', false) === '0') {
    sort = 1;
  }

  if (_.has(req.query, 'page')) {
    var page = req.query.page;

    if (sort === 1) {
      Question.find({
        createdBy: req.user.id,
        "_id": {$gt: page}
      }, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
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
      }, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(questions);
        }
      });
    }
  } else {
    Question.find({createdBy: req.user.id}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json(questions);
      }
    });
  }
});

//获取所有题目
router.route('/all')
.get(isTeacher, function (req, res) {
  /**
  * @param {string} req.query.sort - sorting by publish date
  */
  /**
  * @param {string} req.query.page - the last question's ID, in order to query the following questions
  */
  var sort = -1;

  if (_.get(req.query, 'sort', false) === '0') {
    sort = 1;
  }

  if (_.has(req.query, 'page')) {
    var page = req.query.page;

    if (sort === 1) {
      Question.find({"_id": {$gt: page}}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(questions);
        }
      });
    } else {
      Question.find({"_id": {$lt: page}}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(questions);
        }
      });
    }

  } else {
    Question.find({}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json(questions);
      }
    });
  }
});

//根据标签进行搜索题目
router.route('/query')
.post(isTeacher, function (req, res) {
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
      Question.find({$or: [{tags: {$in: tags}}, {difficulty: {$in: difficulty}}]}, 'context tags subject difficulty type').lean().exec(function (err, questions) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json(questions);
        }
      });
    } else {
      Question.find({$and: [{tags: {$in: tags}}, {difficulty: {$in: difficulty}}]}, 'context tags subject difficulty type').lean().exec(function (err, questions) {
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
