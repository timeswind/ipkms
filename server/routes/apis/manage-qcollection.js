var _ = require('lodash');
var async = require("async");
var express = require('express');
var router = express.Router();

var Question = require('../../models/question');
var Qcollection = require('../../models/qcollection');

//创建新题集
router.route('/qcollection')
    .get(isLoggedIn, function (req, res) {
        if (_.has(req.query, 'id')) {
            var qcollection_id = req.query.id;
            Qcollection.findById(qcollection_id, 'name subject public aveDifficulty questions description').lean().exec(function (err, qcollection) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    Question.find({"_id": {"$in": qcollection.questions}}, 'type context subject tags difficulty').lean().exec(function (err, questions) {
                        if (questions) {
                            var qidIndexDic = {};

                            _.forEach(qcollection.questions, function (question_id, index) {
                                qidIndexDic[question_id] = index
                            });

                            for (var i = 0; i < questions.length; i++) {
                                var question_id = questions[i]._id;
                                var index = qidIndexDic[question_id];

                                qcollection.questions[index] = questions[i]
                            }
                            res.json(qcollection)

                        } else {
                            res.json(qcollection)
                        }
                    });
                }
            });
        } else {
            res.status(400).send('params missing')
        }

    })
    .post(isLoggedIn, function (req, res) {
        /**
         * @param {string} req.body.name - New Qcollection Name
         */
        /**
         * @param {boolean} req.body.public - PRIVATE or Public group
         */
        /**
         * @param {string} req.body.subject - subject of the group
         */
        /**
         * @param {string} req.body.description
         */

        var requiredParams = ['name', 'public', 'subject'];
        var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));

        if (paramsComplete) {

            if (req.body.name.trim() !== '' && req.body.subject.trim() !== '' && _.isBoolean(req.body.public)) {
                var newQcollection = new Qcollection();

                newQcollection.createdBy = req.user.id;

                newQcollection.name = req.body.name;
                newQcollection.public = req.body.public;
                newQcollection.subject = req.body.subject;
                if (_.has(req.body, 'description')) {
                    newQcollection.description = req.body.description;
                }
                newQcollection.save(function (err, qc) {
                    if (err) {
                        res.send(err.message);
                    } else {
                        res.json(qc)
                    }
                });

            } else {
                res.status(400).send('bad params')
            }

        } else {
            res.status(400).send('missing params');
        }
    })
    .delete(isTeacher, function (req, res) {
        var qcollection_id = req.body.qcollection_id;
        if (qcollection_id) {
            Qcollection.findById(qcollection_id, function (err, qc) {
                if (qc.createdBy == req.user.id) {
                    Qcollection.findByIdAndRemove(qcollection_id, function (err) {
                        if (err) {
                            res.status(500).send(err.message)
                        } else {
                            res.send('deleted')
                        }
                    })
                } else {
                    res.status(400).send('permission denied');
                }
            })
        } else {
            res.status(400);
        }
    })
    .put(isTeacher, function (req, res) {
        /**
         * @param {string} req.body.qcollection_id
         */
        /**
         * @param {string} req.body.name - New Qcollection Name
         */
        /**
         * @param {boolean} req.body.public - PRIVATE or Public group
         */
        /**
         * @param {string} req.body.subject - subject of the group
         */
        /**
         * @param {string} req.body.description
         */

        var requiredParams = ['qcollection_id', 'name', 'public', 'subject', 'description'];
        var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));

        if (paramsComplete) {
            var qcollection_id = req.body.qcollection_id;
            Qcollection.findById(qcollection_id, function (err, qc) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    if (qc.createdBy == req.user.id) {
                        qc.name = req.body.name;
                        qc.subject = req.body.subject;
                        qc.public = req.body.subject;
                        qc.description = req.body.description;
                        qc.save(function (err) {
                            if (err) {
                                res.status(500).send(err.message);
                            } else {
                                res.send('success')
                            }
                        })
                    } else {
                        res.status(500).send('permission denied')
                    }
                }
            })
        } else {
            res.status(500).send('params missing')
        }
    });


router.route('/qcollection/question')
    .post(isLoggedIn, function (req, res) {
        var checkParams = _.has(req.body, 'qcollection_id') && _.has(req.body, 'question_id');
        if (checkParams) {

            var qcollection_id = req.body.qcollection_id;
            var question_id = req.body.question_id;

            Qcollection.findByIdAndUpdate(
                qcollection_id,
                {$addToSet: {"questions": question_id}},
                {safe: true, upsert: true, new: true},
                function (err) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.send("success");
                    }
                }
            );
        } else {
            res.status(400).send('bad params');
        }
    })
    .delete(isLoggedIn, function (req, res) {
        if (req.body && req.body.qcollection_id && req.body.question_id) {

            var qcollection_id = req.body.qcollection_id;
            var question_id = req.body.question_id;

            Qcollection.findByIdAndUpdate(
                qcollection_id,
                {$pull: {"questions": question_id}},
                function (err) {
                    if (err) {
                        res.status(500).send(err.message);
                    } else {
                        res.send("success");
                    }
                }
            );
        } else {
            res.status(400);
        }
    });

//获取用户自己创建的题集
router.route('/qcollections/mine')
    .get(isLoggedIn, function (req, res) {
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
                Qcollection.find({
                    createdBy: req.user.id,
                    "_id": {$gt: page}
                }, 'name subject public').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(qcollections);
                    }
                });
            } else {
                Qcollection.find({
                    createdBy: req.user.id,
                    "_id": {$lt: page}
                }, 'name subject public').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(qcollections);
                    }
                });
            }

        } else {
            Qcollection.find({createdBy: req.user.id}, 'name subject public').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(qcollections);
                }
            });
        }
    });

//获取所有公开题集
router.route('/qcollections/all')
    .get(isLoggedIn, function (req, res) {
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

        if (req.query && req.query.page) {
            var page = req.query.page;

            if (sort === 1) {
                Qcollection.find({
                    "public": true,
                    "_id": {$gt: page}
                }, 'name subject createdBy aveDifficulty').populate('createdBy', 'local.name').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(qcollections);
                    }
                });
            } else {
                Qcollection.find({
                    "public": true,
                    "_id": {$lt: page}
                }, 'name subject createdBy aveDifficulty').populate('createdBy', 'local.name').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(qcollections);
                    }
                });
            }

        } else {
            Qcollection.find({"public": true}, 'name subject createdBy aveDifficulty').populate('createdBy', 'local.name').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(qcollections);
                }
            });
        }

    });

router.route('/query')
    .post(isTeacher, function (req, res) {
        /**
         * @param {array} req.body.name - qcollection name
         */
        /**
         * @param {array} req.body.subject - qcollection subject
         */
        var checkParams = _.has(req.body, 'name') && _.isString(req.body.name) && _.has(req.body, 'subject') && _.isString(req.body.subject);
        if (checkParams) {

            var name = req.body.name;
            var subject = req.body.subject;

            Qcollection.find({$and: [{name: {$regex: name}}, {subject: subject}]}, 'name subject public createdBy aveDifficulty').lean().exec(function (err, qcollections) {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.json(qcollections);
                }
            });

        } else {
            res.status(400).send('bad params')
        }
    });


//更新题集的平均难度
router.route('/update-difficulty')
    .put(isLoggedIn, function (req, res) {
        var qcollection_id = req.body.qcollection_id;
        var updatedObject = {
            "aveDifficulty": req.body.aveDifficulty
        };
        Qcollection.findByIdAndUpdate(qcollection_id, updatedObject, function (err) {
            if (err) {
                res.send(err);
            } else {
                res.json('success');
            }
        })
    });

//给题集增加题目
router.route('/add-question')
    .post(isLoggedIn, function (req, res) {
        if (req.body && req.body.qcollection_id && req.body.question_id) {

            var qcollection_id = req.body.qcollection_id;
            var question_id = req.body.question_id;

            Qcollection.findByIdAndUpdate(
                qcollection_id,
                {$addToSet: {"questions": question_id}},
                {safe: true, upsert: true, new: true},
                function (err) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.json("success");
                    }
                }
            );
        } else {
            res.status(400);
        }
    });

//搜索题集的名字
router.route('/teacher/query/name')
    .post(isTeacher, function (req, res) {

        var name = req.body.name;
        var type = req.body.type;

        if (type === 'mine') {
            Qcollection.find({
                'name': new RegExp(name, 'i'),
                'createdBy': req.user.id
            }, 'name subject public createdBy aveDifficulty questions').lean().exec(function (err, qcollections) {
                if (err) {
                    res.send(err);
                } else {
                    if (qcollections) {
                        for (var i = 0; i < qcollections.length; i++) {
                            if (qcollections[i].questions) {
                                qcollections[i].questions = qcollections[i].questions.length;
                            }
                        }
                        res.json(qcollections);
                    } else {
                        res.json({});
                    }
                }
            });
        } else {
            Qcollection.find({
                'name': new RegExp(name, 'i'),
                'public': true
            }, 'name subject public createdBy aveDifficulty questions').lean().exec(function (err, qcollections) {
                if (err) {
                    res.send(err);
                } else {
                    if (qcollections) {
                        for (var i = 0; i < qcollections.length; i++) {
                            if (qcollections[i].questions) {
                                qcollections[i].questions = qcollections[i].questions.length;
                            }
                        }
                        res.json(qcollections);
                    } else {
                        res.json({});
                    }
                }
            });
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

