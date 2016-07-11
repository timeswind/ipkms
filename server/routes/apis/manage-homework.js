var _ = require('lodash');
var express = require('express');
var router = express.Router();

// var Teacher = require('../../models/teacher');
// var Student = require('../../models/student');
// var Group = require('../../models/group');

var Thomework = require('../../models/thomework');

router.route('/teacher/homeworks')
    .get(isTeacher, function (req, res) {
        var teacher_id = req.user.teacher;
        Thomework.find({teacher: teacher_id}, 'name delivery subject title tags').sort({_id: -1}).lean().exec(function (err, homeworks) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                res.json(homeworks)
            }
        })
    })
    .post(isTeacher, function (req, res) { //create homework
        var teacher_id = req.user.teacher;
        var data = req.body
        var requiredParams = ['title', 'delivery', 'requirement', 'subject', 'tags']
        if (_.isObject(req.body) && _.every(requiredParams, _.partial(_.has, data))) {
            var newThomework = new Thomework();
            newThomework.teacher = teacher_id;
            newThomework.title = data.title
            newThomework.subject = data.subject
            newThomework.delivery = data.delivery
            newThomework.requirement = data.requirement
            newThomework.tags = data.tags

            if (data.delivery === true) {
                var additionParams = ['targetGroup', 'deadline']
                if (_.every(additionParams, _.partial(_.has, data))) {
                    newThomework.targetGroup = data.targetGroup
                    newThomework.deadline = data.deadline
                    newThomework.save(function (err) {
                        if (err) {
                            res.status(500).send(err.message)
                        } else {
                            res.send('success')
                        }
                    })
                } else {
                    res.status(400).send('params missing')
                }

            } else {
                newThomework.save(function (err) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.send('success')
                    }
                })
            }
        } else {
            res.status(400).send('params wrong or missing')
        }
    })
    .delete(isTeacher, function (req, res) {
        var data = req.body;
        var teacher_id = req.user.teacher;
        var requiredParam = 'thomework_id';
        if (teacher_id && _.has(data, requiredParam)) {
            Thomework.findById(data.thomework_id, function (err, homework) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    if (homework.teacher == teacher_id) {
                        homework.remove(function (err) {
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

router.route('/teacher/homework/:homework_id')
    .get(isTeacher, function (req, res) {
        if (_.has(req.params, 'homework_id')) {
            var homework_id = req.params.homework_id;
            Thomework.findOne({'_id': homework_id}, 'name delivery subject title requirement deadline tags').lean().exec(function (err, homework) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(homework)
                }
            })
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
