var _ = require('lodash');
var express = require('express');
var router = express.Router();

var User = require('../../models/localuser');
var Question = require('../../models/question');

//创建新题目
router.route('/questions')
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

        var data = req.body;
        // REQUIRED @params
        var requiredParams = ['type', 'subject', 'context', 'choices', 'answer', 'tags', 'difficulty'];
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

                newQuestion.save(function (err, q) {
                    if (err) {
                        res.status(500).send(err.message);
                    } else {
                        res.json(q)
                    }
                });
            } else {
                res.status(400).send('question type not support !')
            }
        } else {
            res.status(400);
        }
    });

router.route('/question/:question_id') //get question's detail without answer
    .get(isLoggedIn, function (req, res) {
        /**
         * @param {string} req.params.question_id - Question ID
         */
        if (_.has(req.params, 'question_id')) {
            var question_id = req.params.question_id;
            var selectFields = 'context tags subject difficulty type choices';
            if (_.has(req.user, 'teacher')) {
                selectFields = 'createdBy context tags subject difficulty type choices updated_at statistic answer'
            }
            Question.findById(question_id, selectFields).lean().exec(function (err, question) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    if (question.createdBy == req.user.id) {
                        question.createdBy = 'self';
                        res.json(question)
                    } else {
                        question.createdBy = 'unknown';
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
        var requiredParams = ['subject', 'difficulty', 'tags'];
        var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));
        if (_.has(req.params, 'question_id') && paramsComplete && _.isNumber(req.body.difficulty) && _.isArray(req.body.tags)) {

            var updateData = {
                subject: req.body.subject,
                difficulty: req.body.difficulty,
                tags: req.body.tags,
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
    .post(isLoggedIn, function (req, res) {
        /**
         * @param {array} req.body.tags - array of tags which used to query the questions that has the tags
         */
        /**
         * @param {string} req.body.content
         */
        if (_.has(req.body, 'tags') && _.isArray(req.body.tags)) {
            Question.find({tags: {$in: req.body.tags}}, 'context tags subject difficulty type').lean().exec(function (err, questions) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.json(questions);
                }
            });
        } else {
            res.status(400)
        }
    });

module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.user) {
        return next();
    } else {
        res.status(401);
    }
}

function isTeacher(req, res, next) {

    if (req.user.role == "teacher") {
        return next();
    } else {
        res.status(401);
    }
}

