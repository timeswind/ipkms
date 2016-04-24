"use strict";
var async = require('async');
var express = require('express');
var router = express.Router();

var Quickquiz = require('../../models/quickquiz');
var Quizsample = require('../../models/quizsample');
var Qcollection = require('../../models/qcollection');

router.route('/teacher/quickquizs')
    .get(isTeacher, function (req, res) {
        var teacher_id = req.user.teacher;
        var sort = -1;

        if (req.query.sort && req.query.sort === '0') {
            sort = 1;
        }

        if (req.query && req.query.page) {
            // @params page is the last item's unique ID to determine the page, !!!not the number of the page!!!
            var page = req.query.page;

            if (sort === 1) {
                Quickquiz.find({
                    createdBy: teacher_id,
                    "_id": {$gt: page}
                }, 'title finished time startTime finishTime').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.json(quickquizs)
                    }
                })
            } else {
                Quickquiz.find({
                    createdBy: teacher_id,
                    "_id": {$lt: page}
                }, 'title finished time startTime finishTime').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.json(quickquizs)
                    }
                })
            }

        } else {
            Quickquiz.find({createdBy: teacher_id}, 'title finished time startTime finishTime').sort({_id: sort}).limit(10).exec(function (err, quickquizs) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(quickquizs)
                }
            })
        }


    })
    .post(isTeacher, function (req, res) {
        var teacher_id = req.user.teacher;

        if (req.body.title && req.body.time && req.body.qcollection_id) {
            if (req.body.title.trim() !== '' && req.body.time > 0) {

                let title = req.body.title;
                let time = req.body.time;
                let qcollection_id = req.body.qcollection_id;

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
                        newQuickquiz.createdBy = teacher_id;
                        newQuickquiz.time = time;
                        newQuickquiz.questions = questionIdArray;
                        newQuickquiz.finished = false;
                        newQuickquiz.startTime = new Date();

                        newQuickquiz.save(function (err, quickquiz) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, quickquiz)
                            }
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        res.status(500).send(err.message);
                    } else if (result) {
                        res.json(result.id);
                    }
                });

            } else {
                res.status(400)
            }
        } else {
            res.status(400)
        }


    })
    .delete(isTeacher, function (req, res) {

    });

router.route('/teacher/quickquiz')
    .get(isTeacher, function (req, res) {
        if (req.query && req.query.id) {
            var quickquiz_id = req.query.id;
            Quickquiz.findById(quickquiz_id).populate('students', 'name').lean().exec(function (err, quickquiz) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    if (quickquiz && quickquiz.questions) {
                        quickquiz.questions = quickquiz.questions.length;
                        res.json(quickquiz)
                    } else {
                        res.json(quickquiz)
                    }
                }
            })
        } else {
            res.status(403).send('params missing')
        }
    });

router.route('/teacher/quickquiz/end')
    .post(isTeacher, function (req, res) {
        // @params quickquiz_id the quiz the teacher wants to end
        var teacher_id = req.user.teacher;
        /** @namespace req.body.quickquiz_id */
        if (req.body && req.body.quickquiz_id) {
            var quickquiz_id = req.body.quickquiz_id;
            Quickquiz.findById(quickquiz_id, function (err, quickquiz) {
                if (err) {
                    res.send(err.message)
                } else {
                    if (quickquiz && !quickquiz.finished && quickquiz.createdBy && quickquiz.createdBy == teacher_id) {
                        quickquiz.finished = true;
                        quickquiz.finishTime = new Date();
                        quickquiz.save();
                        res.send('success');
                    } else {
                        res.status(403).send('End quickquiz fail!')
                    }
                }
            })
        } else {
            res.status(403).send('params missing')
        }
    });

router.route('/student/quickquiz/questions')
    .get(isStudent, function (req, res) {
        if (req.query && req.query.id) {
            var quickquiz_id = req.query.id;
            var student_id = req.user.student;

            Quickquiz.findById(quickquiz_id, 'title time questions students').populate('questions', 'context type choices answer').lean().exec(function (err, quickquiz) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    if (JSON.parse(JSON.stringify(quickquiz.students)).indexOf(student_id) >= 0) {
                        var correctAnswers = [];

                        for (var i = 0; i < quickquiz.questions.length; i++) {
                            if (quickquiz.questions[i].type === 'mc') {
                                correctAnswers.push(quickquiz.questions[i].answer.mc);
                            } else if (quickquiz.questions[i].type === 'long') {
                                correctAnswers.push(null);
                            }
                        }

                        quickquiz.correctAnswers = correctAnswers;

                        res.json(quickquiz)
                    } else {
                        res.status(403).send('permission denied')
                    }
                }
            })

        } else {
            res.status(403).send('params wrong')
        }

    })

router.route('/student/quickquiz')
    .get(isStudent, function (req, res) {
        if (req.query && req.query.id) {
            var quickquiz_id = req.query.id;
            var student_id = req.user.student;

            Quizsample.findOne({quickquiz: quickquiz_id, student: student_id}, function (err, quizsample) {
                if (err) {
                    res.status(500).json(err.message)
                } else {
                    if (quizsample) {
                        res.json(quizsample)
                    } else {
                        Quickquiz.findById(quickquiz_id, 'title finished time questions').populate('questions', 'context type choices').lean().exec(function (err, quickquiz) {
                            if (err) {
                                res.status(500).send(err.message)
                            } else {
                                if (quickquiz && quickquiz.finished && quickquiz.finished === true) {
                                    res.status(403).json('finished')
                                } else if (quickquiz) {
                                    Quickquiz.update({_id: quickquiz_id}, {$addToSet: {students: student_id}}, function (err) {
                                        if (err) {
                                            res.status(500).send(err.message)
                                        } else {
                                            res.json(quickquiz)
                                        }
                                    })
                                } else {
                                    res.status(404).json('not found')
                                }
                            }
                        })
                    }
                }
            });
        } else {
            res.status(403).send('params wrong')
        }

    })
    .post(isStudent, function (req, res) { // hand in the quick quiz
        if (req.body && req.body.id && req.body.answers) {
            var quickquiz_id = req.body.id;
            var studentAnswers = req.body.answers;
            var student_id = req.user.student;

            async.waterfall([
                function (callback) {
                    Quizsample.count({quickquiz: quickquiz_id, student: student_id}, function (err, count) {
                        if (err) {
                            callback(err)
                        } else {
                            if (count === 0) {
                                callback(null)
                            } else {
                                callback({message: 'already handin'})
                            }
                        }
                    });
                },
                function (callback) {
                    Quickquiz.findById(quickquiz_id, 'questions').populate('questions', 'type answer').lean().exec(function (err, quickquiz) {
                        if (err) {
                            callback(err)
                        } else {
                            if (quickquiz && quickquiz.questions) {
                                callback(null, quickquiz.questions)
                            } else if (quickquiz && quickquiz.questions && quickquiz.questions.length === 0) {
                                callback({message: 'Quickquiz do not contain questions'})
                            } else {
                                callback({message: 'Quickquiz not found'})
                            }
                        }
                    });

                },
                function (questions, callback) {

                    var checkAnswersRestults = {
                        right: [],
                        wrong: [],
                        blank: [],
                        exception: []
                    };

                    var correctAnswers = [];

                    for (var i = 0; i < questions.length; i++) {
                        if (questions[i].type === 'mc') {
                            correctAnswers.push(questions[i].answer.mc);
                            if (questions[i].answer.mc !== null) {
                                if (studentAnswers[i] === null) {
                                    checkAnswersRestults.blank.push(i);
                                } else if (studentAnswers[i] === questions[i].answer.mc) {
                                    checkAnswersRestults.right.push(i);
                                } else {
                                    checkAnswersRestults.wrong.push(i);
                                }
                            } else {
                                checkAnswersRestults.exception.push(i);
                            }
                        } else if (questions[i].type === 'long') {
                            correctAnswers.push(null);
                            checkAnswersRestults.exception.push(i);
                        }
                    }

                    var results = {
                        correctAnswers: correctAnswers,
                        checkAnswersRestults: checkAnswersRestults
                    };

                    callback(null, results)

                },
                function (results, callback) {

                    var newSample = new Quizsample();

                    newSample.quickquiz = quickquiz_id;
                    newSample.student = student_id;
                    newSample.answers = studentAnswers;
                    newSample.results = results.checkAnswersRestults;
                    newSample.time = null;
                    newSample.finishTime = new Date();

                    newSample.save(function (err, sample) {
                        if (err) {
                            callback(err)
                        } else {
                            Quickquiz.findByIdAndUpdate(quickquiz_id, {$addToSet: {samples: sample}}, function (err) {
                                if (err) {
                                    callback(err)
                                } else {
                                    callback(null, results)
                                }
                            });
                        }
                    });

                }
            ], function (err, results) {
                if (err) {
                    res.status(500).send(err.message);
                } else if (results) {
                    res.json(results);
                }
            });


        } else {
            res.status(403)
        }
    });


module.exports = router;


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
