var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');

var Group = require('../../models/group');

router.route('/teacher/groups')
    .get(isTeacher, function (req, res) {
        var teacher_id = req.user.teacher
        Group.find({'public.owner': teacher_id}, 'name students public.boolean').lean().exec(function (err, groups) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                for (i = 0; i < groups.length; i++) {
                    groups[i].students = groups[i].students.length
                }
                res.json(groups)
            }
        })
    })

router.route('/teacher/groups/:group_id')
    .delete(isTeacher, function (req, res) {
        var group_id = req.params.group_id

        Group.findOneAndRemove({_id: group_id}, {teacher_id: req.user.teacher}, function (err) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                res.send('Delete group success !')
            }
        })
    })

router.route('/public/groups')
    .get(isTeacher, function (req, res) {
        Group.find({'public.boolean': true}, 'name students public.boolean').lean().exec(function (err, groups) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                for (i = 0; i < groups.length; i++) {
                    groups[i].students = groups[i].students.length
                }
                res.json(groups)
            }
        })
    })

module.exports = router;

function isLoggedIn(req, res, next) {

    if (req.user) {
        return next();
    } else {
        res.status(401);
    }
}

function isAdmin(req, res, next) {

    if (req.user.role == "admin") {
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
