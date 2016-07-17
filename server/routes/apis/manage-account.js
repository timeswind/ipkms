var _ = require('lodash');
var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');

router.route('/students')
    .get(isAdmin, function (req, res) {
        /**
         * @param {string} req.query.name - student name
         */
        /**
         * @param {string} req.query.schoolId - student schoolid
         */
        /**
         * @param {string} req.query.option
         */

        if (_.get(req.query, 'option', false) === 'all') {
            Student.find({}, "name schoolId").lean().exec(function (err, students) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(students);
                }
            });
        } else {
            var name = req.query.name;
            var schoolId = req.query.schoolId;

            Student.find({
                name: {$regex: name},
                schoolId: {$regex: schoolId}
            }, 'name class schoolId').lean().exec(function (err, students) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(students);
                }
            })
        }

    })
    .post(isAdmin, function (req, res) {
        /**
         * @param {string} req.body.name - student name
         */
        /**
         * @param {string} req.body.schoolId - student schoolid
         */
        /**
         * @param {number} req.body.grade
         */
        /**
         * @param {string} req.body.class
         */

        var requiredParams = ['name', 'schoolId', 'grade', 'class'];
        var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));

        if (paramsComplete) {
            var name = req.body.name;
            var schoolId = req.body.schoolId;
            var grade = req.body.grade;
            var theclass = req.body.class; //不能用class，与js中的class重名

            var newStudent = new Student();
            newStudent.name = name;
            newStudent.schoolId = schoolId;
            newStudent.grade = grade;
            newStudent.class = theclass;

            newStudent.save(function (err, s) {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    var newUser = new User();
                    /** @namespace newUser.local */
                    newUser.local.name = s.name;
                    newUser.local.schoolId = s.schoolId;
                    newUser.local.role = 'student';
                    newUser.local.student = s.id;
                    newUser.local.password = newUser.generateHash("123456"); //默认密码123456
                    newUser.save(function (err) {
                        if (err) {
                            res.status(400).send(err.message);
                        } else {
                            res.send('success')
                        }
                    })
                }
            })
        } else {
            res.status(400).send('params missing')
        }

    })
    .delete(isAdmin, function (req, res) {
        /**
         * @param {string} req.body.student_id - Student ID
         */
        var student_id = req.body.student_id;
        User.find({'local': {'student': student_id}}).remove(function (err) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                Student.findByIdAndRemove(student_id, function (err) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.send('success')
                    }
                })
            }
        })
    });

router.route('/students/:student_id')
    .get(isAdmin, function (req, res) {
        /**
         * @param {string} req.params.student_id - Student ID
         */
        if (_.has(req.params, 'student_id')) {
            var student_id = req.params.student_id;
            Student.findById(student_id, 'name schoolId class grade', function (err, student) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(student)
                }
            })
        } else {
            res.status(400).send("No student id provided")
        }
    })
    .put(isAdmin, function (req, res) {
        /**
         * @param {string} req.params.student_id - Student ID
         */
        /**
         * @param {string} req.body.name - student name
         */
        /**
         * @param {string} req.body.schoolId - student schoolid
         */
        /**
         * @param {number} req.body.grade
         */
        /**
         * @param {string} req.body.class
         */

        var requiredParams = ['name', 'schoolId', 'grade', 'class'];
        var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));

        if (_.has(req.params, 'student_id') && paramsComplete) {
            var student_id = req.params.student_id;
            var updatedObject = {
                "name": req.body.name,
                "schoolId": req.body.schoolId, //pre save? check repeat
                "grade": req.body.grade,
                "class": req.body.class
            };
            Student.findOneAndUpdate({_id: student_id}, updatedObject, {new: true}, function (err, student) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(student)
                }
            })
        } else {
            res.status(400).send("params missing")
        }
    });

router.route('/students/reset-password/:student_id')
    .get(isAdmin, function (req, res) {

        /**
         * @param {string} req.params.student_id - Student ID
         */

        if (_.has(req.params, 'student_id')) {
            var student_id = req.params.student_id;
            User.findOne({'local.student': student_id}, 'local.name local.role', function (err, user) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(user)
                }
            })
        } else {
            res.status(400).send('params missing')
        }

    })
    .post(isAdmin, function (req, res) {
        /**
         * @param {string} req.params.student_id - Student ID
         */
        /**
         * @param {string} req.body.password - new password
         */

        if (_.has(req.params, 'student_id') && _.has(req.body, 'password')) {
            var student_id = req.params.student_id;
            var password = req.body.password;
            if (password.trim() !== '') {

                User.findOneAndUpdate({'local': {'student': student_id}}, {$set: {'local.password': User().generateHash(password)}}, {new: true}, function (err) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.send('reset password success')
                    }
                })
            } else {
                res.status(400).send('invaild password')
            }
        } else {
            res.status(400).send('params missing')
        }


    })

router.route('/teachers')
    .get(isAdmin, function (req, res) {
        /**
         * @param {string} req.query.name - teacher name
         */
        /**
         * @param {string} req.query.email - teacher email
         */
        var name = req.query.name;
        var email = req.query.email;
        Teacher.find({name: {$regex: name}, email: {$regex: email}}, 'name email', function (err, teachers) {
            if (err) {
                res.status(406).send(err.message);
            } else {
                res.json(teachers);
            }
        })
    })
    .post(isAdmin, function (req, res) {
        /**
         * @param {string} req.body.name - teacher name
         */
        /**
         * @param {string} req.body.email - teacher email
         */

        if (_.has(req.body, 'name') && _.has(req.body, 'email')) {
            var name = req.body.name;
            var email = req.body.email;

            var newTeacher = new Teacher();
            newTeacher.name = name;
            newTeacher.email = email;

            newTeacher.save(function (err, t) {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    var newUser = new User();
                    newUser.local.name = t.name;
                    newUser.local.email = t.email;
                    newUser.local.role = 'teacher';
                    newUser.local.teacher = t.id;
                    newUser.local.password = newUser.generateHash("123456"); //默认密码123456
                    newUser.save(function (err) {
                        if (err) {
                            res.status(400).send(err.message);
                        } else {
                            res.send('success')
                        }
                    })
                }
            })
        } else {
            res.status(400).send('params missing')
        }
    })
    .delete(isAdmin, function (req, res) {
        /**
         * @param {string} req.body.teacher_id - Teacher ID
         */
        var teacher_id = req.body.teacher_id;
        User.find({'local': {'teacher': teacher_id}}).remove(function (err) {
            if (err) {
                send.status(500).send(err.message)
            } else {
                Teacher.findByIdAndRemove(teacher_id, function (err) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.json('success')
                    }
                })
            }
        })
    })

router.route('/teachers/:teacher_id')
    .get(isAdmin, function (req, res) {
        /**
         * @param {string} req.params.teacher_id - Teacher ID
         */
        if (_.has(req.params, 'teacher_id')) {
            var teacher_id = req.params.teacher_id;

            Teacher.findById(teacher_id, 'name email', function (err, teacher) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(teacher)
                }
            })
        } else {
            res.status(400).send("params missing")
        }
    })

router.route('/teachers/reset-password/:teacher_id')
    .get(isAdmin, function (req, res) {
        /**
         * @param {string} req.params.teacher_id - Teacher ID
         */
        if (_.has(req.params, 'teacher_id')) {
            var teacher_id = req.params.teacher_id;
            User.findOne({'local': {'teacher': teacher_id}}, 'local.name local.role', function (err, user) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(user)
                }
            })
        } else {
            res.status(400).send("params missing")
        }

    })
    .post(isAdmin, function (req, res) {
        /**
         * @param {string} req.params.teacher_id - Teacher ID
         */
        /**
         * @param {string} req.body.password - new password for teacher account
         */

        if (_.has(req.params, 'teacher_id') && _.has(req.body, 'password')) {
            var teacher_id = req.params.teacher_id;
            var password = req.body.password;
            if (password.trim() !== '') {
                User.findOneAndUpdate({'local': {'teacher': teacher_id}}, {$set: {'local.password': User().generateHash(password)}}, {new: true}, function (err, user) {
                    if (err) {
                        res.status(500).send(err.message)
                    } else {
                        res.send('reset password success')
                    }
                })
            } else {
                res.status(406).send('invaild password')
            }
        } else {
            res.status(400).send('params missing')
        }

    });

module.exports = router;


function isAdmin(req, res, next) {

    if (req.user.role == "admin") {
        return next();
    } else {
        res.status(401);
    }
}

