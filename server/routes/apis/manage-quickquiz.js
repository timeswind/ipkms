"use strict";
var _ = require('lodash');
var async = require('async');
var express = require('express');
var router = express.Router();

var Question = require('../../models/question');
var Quickquiz = require('../../models/quickquiz');
var Quizsample = require('../../models/quizsample');
var Qcollection = require('../../models/qcollection');

router.route('/teacher/quickquizs')
    .get(isTeacher, function (req, res) {
        var teacher_id = req.user.teacher;
        var sort = -1;

        if (_.get(req.query, 'sort', false) === '0') {
            sort = 1;
        }

        if (_.has(req.query, 'page')) {
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
        if (_.has(req.query, 'id')) {
            var quickquiz_id = req.query.id;
            var populateQuery = [
                {path: "students", select: "name"},
                {path: "samples", select: "student results startTime finishTime"}
            ];
            Quickquiz.findById(quickquiz_id).populate(populateQuery).lean().exec(function (err, quickquiz) {
                if (err) {
                    res.status(500).send(err.message)
                } else {

                    if (_.has(quickquiz, 'questions')) {
                        quickquiz.questions = quickquiz.questions.length;
                    }

                    res.json(quickquiz)

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

router.route('/teacher/quickquiz/end')
    .post(isTeacher, function (req, res) {
        /**
         * @param {string} req.body.quickquiz_id
         */
        var teacher_id = req.user.teacher;

        async.waterfall([
            function (callback) {
                if (_.has(req.body, 'quickquiz_id')) {
                    Quickquiz.findById(req.body.quickquiz_id).lean().exec(function (err, quickquiz) {
                        if (err) {
                            callback(err)
                        } else {
                            if (!_.get(quickquiz, 'finished', true) && _.get(quickquiz, 'createdBy', null) == teacher_id) {
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

        // if (_.has(req.body, 'quickquiz_id')) {
        //     Quickquiz.findById(req.body.quickquiz_id, function (err, quickquiz) {
        //         if (err) {
        //             res.send(err.message)
        //         } else {
        //             if (!_.get(quickquiz, 'finished', true) && _.get(quickquiz, 'createdBy', null) == teacher_id) {
        //
        //                 Quizsample.find({"_id": {'$in': _.get(quickquiz, 'samples', [])}}).lean().exec(function (err, quizSamples) {
        //                     if (quizSamples) {
        //                         var totalCorrectCount = 0;
        //                         var totalTimeCost = 0; //in millisecond
        //
        //                         _.forEach(quizSamples, function (quizSample) {
        //                             totalCorrectCount += quizSample.results.right.length;
        //                             if (_.has(quizSample, 'startTime') && _.has(quizSample, 'finishTime')) {
        //                                 totalTimeCost += Math.abs(quizSample.startTime - quizSample.finishTime);
        //                             } else if (_.has(quizSample, 'finishTime')) {
        //                                 totalTimeCost += Math.abs(quickquiz.startTime - quizSample.finishTime);
        //                             }
        //                         });
        //
        //                         let aveCorrectCount = totalCorrectCount / quizSamples.length;
        //                         let aveTimeCost = totalTimeCost / quizSamples.length;
        //
        //                         console.log(aveCorrectCount);
        //                         console.log(aveTimeCost);
        //
        //                         quickquiz.finished = true;
        //                         quickquiz.analysis.average.right = aveCorrectCount;
        //                         quickquiz.analysis.average.time = aveTimeCost;
        //                         quickquiz.finishTime = new Date();
        //                         quickquiz.save();
        //                         res.send('success');
        //                     } else {
        //                         quickquiz.finished = true;
        //                         quickquiz.analysis.average.right = 0;
        //                         quickquiz.analysis.average.time = 0;
        //                         quickquiz.finishTime = new Date();
        //                         quickquiz.save();
        //                         res.send('success');
        //                     }
        //
        //                 });
        //
        //             } else {
        //                 res.status(403).send('End quickquiz fail!')
        //             }
        //         }
        //     })
        // } else {
        //     res.status(403).send('params missing')
        // }
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

            Quickquiz.findById(quickquiz_id, 'title time questions students createdBy').populate(populateQuery).lean().exec(function (err, quickquiz) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    if (JSON.parse(JSON.stringify(quickquiz.students)).indexOf(student_id) > -1 && _.has(quickquiz, 'questions')) {
                        delete quickquiz.students;
                        Question.find({"_id": {"$in": quickquiz.questions}}, 'context type choices answer').lean().exec(function (err, questions) {
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
                                quickquiz.reqRole = 'student';
                                res.json(quickquiz)

                            } else {
                                res.status(400).json(quickquiz)
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

    })

router.route('/quickquiz')
    .get(isLoggedIn, function (req, res) {
        if (_.has(req.query, 'id')) {
            var quickquiz_id = req.query.id;

            if (_.has(req.user, 'student')) {

                var student_id = req.user.student;

                Quizsample.findOne({
                    quickquiz: quickquiz_id,
                    student: student_id
                }).lean().exec(function (err, quizsample) {
                    if (err) {
                        res.status(500).json(err.message)
                    } else {
                        if (quizsample && _.has(quizsample, 'finishTime')) {
                            res.json(quizsample)
                        } else {
                            var populateQuery = [
                                {path: "createdBy", select: "name"}
                            ];

                            Quickquiz.findById(quickquiz_id, 'title finished time questions createdBy').populate(populateQuery).lean().exec(function (err, quickquiz) {
                                if (err) {
                                    res.status(500).send(err.message)
                                } else {
                                    if (_.get(quickquiz, 'finished', false)) {
                                        res.status(403).send('finished')
                                    } else if (quickquiz) {
                                        Quickquiz.findOneAndUpdate({_id: quickquiz_id}, {$addToSet: {students: student_id}}, function (err) {
                                            if (err) {
                                                res.status(500).send(err.message)
                                            } else {
                                                Question.find({"_id": {"$in": quickquiz.questions}}, 'context type choices').lean().exec(function (err, questions) {
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
                                                        res.json(quickquiz)

                                                    } else {
                                                        res.status(400).json(quickquiz)
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        res.status(404).send('not found')
                                    }
                                }
                            })
                        }
                    }
                });

            } else if (_.has(req.user, 'teacher')) {

                // var teacher_id = req.user.teacher;
                var populateQuery = [
                    {path: "createdBy", select: "name"}
                ];

                // {path: "questions", select: "context type choices answer"},

                Quickquiz.findById(quickquiz_id, 'title finished time questions createdBy analysis').populate(populateQuery).lean().exec(function (err, quickquiz) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else if (quickquiz && _.has(quickquiz, 'questions')) {

                        Question.find({"_id": {"$in": quickquiz.questions}}, 'context type choices answer').lean().exec(function (err, questions) {
                            if (questions) {
                                var qidIndexDic = {}

                                _.forEach(quickquiz.questions, function (question_id, index) {
                                    qidIndexDic[question_id] = index
                                });

                                var correctAnswers = _.times(quickquiz.questions.length, _.constant(null));

                                for (var i = 0; i < questions.length; i++) {
                                    var question_id = questions[i]._id
                                    var index = qidIndexDic[question_id]

                                    quickquiz.questions[index] = questions[i]

                                    if (questions[i].type === 'mc') {
                                        correctAnswers[index] = questions[i].answer.mc;
                                    }

                                }

                                quickquiz.correctAnswers = correctAnswers;
                                quickquiz.reqRole = 'teacher';
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
    .post(isStudent, function (req, res) { // hand in the quick quiz
        /**
         * @param {string} req.body.id - Quickquiz Unique ID
         */
        /**
         * @param {array} req.body.answers - student's answer to questions in same order as question set
         */
        if (_.every(['id', 'answers'], _.partial(_.has, req.body)) && _.isArray(req.body.answers)) {

            var quickquiz_id = req.body.id;
            var studentAnswers = req.body.answers;
            var student_id = req.user.student;

            async.waterfall([
                function (callback) {
                    Quizsample.findOne({
                        quickquiz: quickquiz_id,
                        student: student_id
                    }).lean().exec(function (err, quizsample) {
                        if (err) {
                            callback(err)
                        } else {
                            if (quizsample) {
                                if (_.has(quizsample, 'finishTime')) {
                                    callback({message: 'already handed in'})
                                } else {
                                    callback(null)
                                }
                            } else {
                                res.status(500).send('can not find quizsample')
                            }
                        }
                    });
                },
                function (callback) {
                    Quickquiz.findById(quickquiz_id, 'questions analysis').lean().exec(function (err, quickquiz) {
                        if (err) {
                            callback(err)
                        } else {
                            if (quickquiz) {
                                if (_.has(quickquiz, 'questions')) {
                                    Question.find({'_id': {'$in': quickquiz.questions}}, 'type answer').lean().exec(function (err, questions) {
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

                                            callback(null, quickquiz.questions, quickquiz.analysis)

                                        } else {
                                            callback({message: 'Quickquiz does not have question'})
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
                function (questions, analysis, callback) {

                    var checkAnswersRestults = {
                        right: [],
                        wrong: [],
                        blank: [],
                        exception: []
                    };

                    var correctAnswers = [];

                    for (var i = 0; i < questions.length; i++) {

                        if (_.isObject(questions[i])) {

                            var q_id = questions[i]._id;

                            if (questions[i].type === 'mc') {

                                correctAnswers.push(questions[i].answer.mc);

                                if (_.get(questions[i], 'answer.mc') !== null) {

                                    if (studentAnswers[i] === null) {
                                        checkAnswersRestults.blank.push(i);
                                        Question.findOneAndUpdate({'_id': q_id}, {$inc: {'statistic.blank': 1}}).exec();

                                    } else if (studentAnswers[i] === questions[i].answer.mc) {

                                        checkAnswersRestults.right.push(i);
                                        Question.findOneAndUpdate({'_id': q_id}, {$inc: {'statistic.right': 1}}).exec();

                                    } else {

                                        checkAnswersRestults.wrong.push(i);
                                        Question.findOneAndUpdate({'_id': q_id}, {$inc: {'statistic.wrong': 1}}).exec();

                                    }

                                } else {

                                    checkAnswersRestults.exception.push(i);

                                }


                            } else {

                                correctAnswers.push(null);
                                checkAnswersRestults.exception.push(i);

                            }

                        } else {
                            correctAnswers.push(null);
                            checkAnswersRestults.exception.push(i)
                        }

                    }

                    console.log(checkAnswersRestults);

                    // 为该测验记录每一题的答题情况
                    if (_.has(analysis, 'questions')) {

                        _.forEach(checkAnswersRestults.right, function (question_index) {
                            if (_.isArray(analysis.questions[question_index])) {
                                analysis.questions[question_index][0]++
                            } else {
                                analysis.questions[question_index] = [0, 0, 0, 0];
                                analysis.questions[question_index][0]++
                            }
                        });

                        _.forEach(checkAnswersRestults.wrong, function (question_index) {
                            if (_.isArray(analysis.questions[question_index])) {
                                analysis.questions[question_index][1]++
                            } else {
                                analysis.questions[question_index] = [0, 0, 0, 0];
                                analysis.questions[question_index][1]++
                            }
                        });

                        _.forEach(checkAnswersRestults.blank, function (question_index) {
                            if (_.isArray(analysis.questions[question_index])) {
                                analysis.questions[question_index][2]++
                            } else {
                                analysis.questions[question_index] = [0, 0, 0, 0];
                                analysis.questions[question_index][2]++
                            }
                        });

                        _.forEach(checkAnswersRestults.exception, function (question_index) {
                            if (_.isArray(analysis.questions[question_index])) {
                                analysis.questions[question_index][3]++
                            } else {
                                analysis.questions[question_index] = [0, 0, 0, 0];
                                analysis.questions[question_index][3]++
                            }
                        });
                    }

                    console.log(analysis);

                    var results = {
                        correctAnswers: correctAnswers,
                        checkAnswersRestults: checkAnswersRestults
                    };

                    Quickquiz.findOneAndUpdate({'_id': quickquiz_id}, {'$set': {'analysis.questions': analysis.questions}}, function (err) {
                        if (err) {
                            // !! need error handle !!
                            callback(null, results)
                        } else {
                            callback(null, results)
                        }
                    });

                },
                function (results, callback) {

                    Quizsample.findOne({
                        'quickquiz': quickquiz_id,
                        'student': req.user.student
                    }, function (err, quizsample) {
                        if (err) {
                            callback(err)
                        } else {
                            if (quizsample) {
                                quizsample.answers = studentAnswers;
                                quizsample.results = results.checkAnswersRestults;
                                quizsample.time = null;
                                quizsample.finishTime = new Date();

                                quizsample.save(function (err) {
                                    if (err) {
                                        callback(err)
                                    } else {
                                        callback(null, results);
                                    }
                                });
                            } else {
                                var newquizsample = new Quizsample();
                                newquizsample.quickquiz = quickquiz_id;
                                newquizsample.student = req.user.student;
                                newquizsample.answers = studentAnswers;
                                newquizsample.results = results.checkAnswersRestults;
                                newquizsample.time = null;
                                newquizsample.finishTime = new Date();

                                newquizsample.save(function (err, sample) {
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

                        }

                    })


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


module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.user) {
        return next();
    } else {
        res.status(401);
    }
}


function isTeacher(req, res, next) {

    if (req.user.role == "teacher" && _.has(req.user, 'teacher')) {
        return next();
    } else {
        res.status(401);
    }
}

function isStudent(req, res, next) {

    if (req.user.role == "student" && _.has(req.user, 'student')) {
        return next();
    } else {
        res.status(401);
    }
}
