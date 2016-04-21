var async = require("async");
var express = require('express');
var router = express.Router();

var User = require('../../models/localuser');

var Question = require('../../models/question');

//创建新题目
router.route('/questions')
    .post(isTeacher, function (req, res) {
        if (req.body) {
            var jsonData = req.body;
            var newQuestion = new Question();

            newQuestion.createdBy = req.user.id;
            newQuestion.type = jsonData.type;
            newQuestion.subject = jsonData.subject;
            newQuestion.context = jsonData.context;
            newQuestion.choices = jsonData.choices;
            if (jsonData.type === 'mc') {
                newQuestion.answer.mc = jsonData.answer.mc;
            } else {
                newQuestion.answer.long = jsonData.answer.long;
            }
            newQuestion.tags = jsonData.tags;
            newQuestion.difficulty = jsonData.difficulty;

            newQuestion.save(function (err, q) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(q)
                }
            });
        } else {
            res.status(400);
        }
    });

router.route('/question/:question_id')
    .get(isLoggedIn, function (req, res) {
        if (req.params && req.params.question_id) {
            var question_id = req.params.question_id;
            Question.findById(question_id, 'createdBy context tags subject difficulty type choices updated_at').lean().exec(function (err, question) {
                if (err) {
                    res.send(err);
                } else {

                    if (question.createdBy == req.user.id) {
                        question.createdBy = 'self'
                    }

                    res.json(question);
                }
            });
        } else {
            res.status(400);
        }
    })
    .put(isTeacher, function (req, res) {
        if (req.params && req.params.question_id && req.body) {

            Question.findOneAndUpdate({_id: req.params.question_id}, {$set: req.body}, {user_id: req.user.id}, function (err, question) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.json('success');
                }
            });

        }
    });

router.route('/detail')
    .get(isLoggedIn, function (req, res) {
        if (req.query.question_id) {
            var question_id = req.query.question_id;
            Question.findById(question_id, 'context tags subject difficulty type choices updated_at').exec(function (err, question) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(question);
                }
            });
        } else {
            res.status(400);
        }
    });

//获取题目的答案
router.route('/answer')
    .get(isLoggedIn, function (req, res) {
        if (req.query.question_id) {
            var question_id = req.query.question_id;
            Question.findById(question_id).exec(function (err, question) {
                if (err) {
                    res.send(err);
                } else {
                    if (question) {
                        res.json(question.answer);
                    }
                }
            });
        } else {
            res.status(400);
        }
    });

//删除一个用户自己创建的题目
router.route('/delete/single')
    .delete(isTeacher, function (req, res) {
        var question_id = req.body.question_id;
        if (question_id) {
            Question.findById(question_id, 'createdBy', function (err, q) {
                if (q.createdBy == req.user.id) {

                    q.remove(function (err) {
                        if (err) {
                            res.status(500).send(err.message)
                        } else {
                            res.json('deleted')
                        }
                    });

                } else {
                    res.status(401).json('没有权限');
                }
            })
        } else {
            res.status(400);
        }
    });

//获取用户自己创建的题目
router.route('/mine')
    .get(isTeacher, function (req, res) {
        var sort = -1;

        if (req.query.sort && req.query.sort === '0') {
            sort = 1;
        }

        if (req.query && req.query.page) {
            // @params page is the last item's unique ID to determine the page, !!!not the number of the page!!!
            var page = req.query.page;

            if (sort === 1) {
                Question.find({
                    createdBy: req.user.id,
                    "_id": {$gt: page}
                }, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
                    if (err) {
                        res.send(err);
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
                        res.send(err);
                    } else {
                        res.json(questions);
                    }
                });
            }
        } else {
            Question.find({createdBy: req.user.id}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(questions);
                }
            });
        }
    });

//获取所有题目
router.route('/all')
    .get(isTeacher, function (req, res) {
        var sort = -1;

        if (req.query.sort && req.query.sort === '0') {
            sort = 1;
        }

        if (req.query && req.query.page) {
            // @params page is the last item's unique ID to determine the page, !!!not the number of the page!!!
            var page = req.query.page;

            if (sort === 1) {
                Question.find({"_id": {$gt: page}}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(questions);
                    }
                });
            } else {
                Question.find({"_id": {$lt: page}}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(questions);
                    }
                });
            }

        } else {
            Question.find({}, 'context tags subject difficulty type').sort({"_id": sort}).limit(9).exec(function (err, questions) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(questions);
                }
            });
        }
    });

//根据标签进行搜索题目
router.route('/query/tags')
    .post(isLoggedIn, function (req, res) {
        var tags = req.body.tags;
        Question.find({tags: {$in: tags}}, 'context tags subject difficulty type').exec(function (err, questions) {
            if (err) {
                res.send(err);
            } else {
                res.json(questions);
            }
        });
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

function isStudent(req, res, next) {

    if (req.user.role == "student") {
        return next();
    } else {
        res.status(401);
    }
}
