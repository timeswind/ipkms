var async = require("async");
var express = require('express');
var router = express.Router();

var User = require('../../models/localuser');

var Qcollection = require('../../models/qcollection');

//创建新题集
router.route('/add')
    .post(isLoggedIn, function (req, res) {
        if (req.body) {
            var jsonData = req.body;
            var newQcollection = new Qcollection();

            newQcollection.createdBy = req.user.id;
            newQcollection.subject = jsonData.subject;
            newQcollection.name = jsonData.name;
            newQcollection.public = jsonData.public;
            newQcollection.questions = jsonData.questions;

            newQcollection.save(function (err, q) {
                if (err) {
                    res.send(err);
                } else {
                    res.json('create success')
                }
            });
        } else {
            res.status(400);
        }
    });

//删除用户自己创建的题集
router.route('/delete/single')
    .delete(isTeacher, function (req, res) {
        var qcollection_id = req.body.qcollection_id;
        if (qcollection_id) {
            Qcollection.findById(qcollection_id, function (err, qc) {
                if (qc.createdBy == req.user.id) {
                    Qcollection.findByIdAndRemove(qcollection_id, function (err) {
                        if (err) {
                            throw err;
                        }
                        res.json('deleted')
                    })
                } else {
                    res.status(401).json('没有权限');
                }
            })
        } else {
            res.status(400);
        }
    });

//获取用户自己创建的题集
router.route('/mine')
    .get(isLoggedIn, function (req, res) {
        var sort = -1;

        if (req.query.sort && req.query.sort === '0') {
            sort = 1;
        }

        if (req.query && req.query.page) {
            // @params page is the last item's unique ID to determine the page, !!!not the number of the page!!!
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
router.route('/all')
    .get(isLoggedIn, function (req, res) {
        var sort = -1;

        if (req.query.sort && req.query.sort === '0') {
            sort = 1;
        }

        if (req.query && req.query.page) {
            // @params page is the last item's unique ID to determine the page, !!!not the number of the page!!!
            var page = req.query.page;

            if (sort === 1) {
                Qcollection.find({
                    public: true,
                    "_id": {$gt: page}
                }, 'name subject public createdBy aveDifficulty').populate('createdBy', 'local.name').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(qcollections);
                    }
                });
            } else {
                Qcollection.find({
                    public: true,
                    "_id": {$lt: page}
                }, 'name subject public createdBy aveDifficulty').populate('createdBy', 'local.name').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json(qcollections);
                    }
                });
            }

        } else {
            Qcollection.find({public: true}, 'name subject public createdBy aveDifficulty').populate('createdBy', 'local.name').sort({_id: sort}).limit(12).exec(function (err, qcollections) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(qcollections);
                }
            });
        }

    });

//获取题集的详细内容
router.route('/detail/:qcollection_id')
    .get(isLoggedIn, function (req, res) {
        var qcollection_id = req.params.qcollection_id;
        Qcollection.findById(qcollection_id, 'name subject public aveDifficulty questions').populate('questions', 'type context subject tags difficulty').exec(function (err, qcollection) {
            if (err) {
                res.send(err);
            } else {
                res.json(qcollection);
            }
        });
    });

//更新题集基本信息
router.route('/update-info')
    .put(isLoggedIn, function (req, res) {
        var qcollection_id = req.body.qcollection_id;
        var updatedObject = {
            "name": req.body.name,
            "subject": req.body.subject,
            "public": req.body.public
        };
        Qcollection.findByIdAndUpdate(qcollection_id, updatedObject, {new: true}, function (err, qc) {
            if (err) {
                res.send(err);
            } else {
                res.json(qc);
            }
        })
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

//从题集里移除题目
router.route('/remove-question')
    .delete(isLoggedIn, function (req, res) {
        if (req.body && req.body.qcollection_id && req.body.question_id) {

            var qcollection_id = req.body.qcollection_id;
            var question_id = req.body.question_id;

            Qcollection.findByIdAndUpdate(
                qcollection_id,
                {$pull: {"questions": question_id}},
                function (err, qc) {
                    if (err) {
                        res.send(err);
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
                        for (var i = 0;i<qcollections.length;i++) {
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
                        for (var i = 0;i<qcollections.length;i++) {
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

function isStudent(req, res, next) {

    if (req.user.role == "student") {
        return next();
    } else {
        res.status(401);
    }
}
