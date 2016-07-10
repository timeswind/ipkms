var async = require("async");
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var tokenManager = require('../config/token_manager');

var Teacher = require('../models/teacher');
var Student = require('../models/student');
var User = require('../models/localuser');
var Group = require('../models/group');

var messageApiRoutes = require('./apis/message.js');
var manageAccountApiRoutes = require('./apis/manage-account.js');
var manageQuestionApiRoutes = require('./apis/manage-question.js');
var manageQcollectonApiRoutes = require('./apis/manage-qcollection.js');
var manageGroupApiRoutes = require('./apis/manage-group.js');
var manageQuickquizApiRoutes = require('./apis/manage-quickquiz.js');
var manageHomeworkApiRoutes = require('./apis/manage-homework.js');

router.use(tokenManager.verifyToken, function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
        // get the decoded payload and header
        var firstdecoded = jwt.decode(token, {complete: true});
        var userid = firstdecoded.payload.id;

        User.findById(userid, function (err, user) {
            if (err) {
                return res.json({success: false, message: '用户未找到'});
            } else {
                // verifies secret and checks exp
                jwt.verify(token, user.local.password, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({
                            authorize: false,
                            message: '认证失败'
                        });
                    } else {
                        // if everything is good, save to request for use in other routes
                        req.user = decoded;
                        // console.log(decoded);
                        next();
                    }
                });
            }

        })
    } else {
        // if there is no token
        // return an error
        return res.status(401).send({
            authorize: false,
            message: '认证失败'
        });

    }

});

router.use('/message', messageApiRoutes);
router.use('/manage-account', manageAccountApiRoutes);
router.use('/manage-question', manageQuestionApiRoutes);
router.use('/manage-qcollection', manageQcollectonApiRoutes);
router.use('/manage-group', manageGroupApiRoutes);
router.use('/manage-quickquiz', manageQuickquizApiRoutes);
router.use('/manage-homework', manageHomeworkApiRoutes);

router.route('/isadmin')
    .get(function (req, res) {
        User.findById(req.user.id, function (err, user) {
            if (err)
                res.send(err);

            var responseData = {
                role: user.local.role,
                id: user.id
            };

            res.json(responseData);
        });
    });

router.route('/myinfo')
    .get(isLoggedIn, function (req, res) {
        User.findById(req.user.id, function (err, user) {
            if (err)
                res.send(err);

            var responseData = {
                role: user.local.role,
                id: user.id
            };

            res.json(responseData);
        });
    });

router.route('/teachers')  //get all teacher //admin api
    .get(isAdmin, function (req, res) {
        Teacher.find(function (err, teachers) {
            if (err)
                res.send(err);

            res.json(teachers);
        });
    });

router.route('/teachers/includeuser')  //get all teacher with user populated //admin api
    .get(isAdmin, function (req, res) {
        Teacher.find({})
            .populate('user')
            .exec(function (err, teachers) {
                if (err)
                    res.send(err);

                res.json(teachers);
            })
    });

router.route('/teacher/:user_id') //create a teacher from exist user //admin api
    .post(isAdmin, function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (user) {
                user.role = "teacher";
                user.save(function (err) {
                    if (err)
                        res.send(err);

                    var teacher = new Teacher();
                    teacher.name = user.name;
                    teacher.user = user.id;
                    teacher.userId = user.id;
                    teacher.save(function (err, t) {
                        if (err)
                            res.send(err);

                        User.findById(user.id, function (err, u) {
                            u.local.teacher = t.id;
                            u.save();
                            res.json({message: 'Teacher created and change user_s role to teacher!'});
                        });
                    });
                });
            } else {
                res.send("user not exist!");
            }
            ;
        });

    });

router.route('/teacher/:user_id/:teacher_id') //DELETE single teacher using its user_id and teacher_id //admin api

    .delete(isAdmin, function (req, res) {
        Teacher.remove({_id: req.params.teacher_id}, function (err) {
            if (err)
                res.send(err);

            User.findById(req.params.user_id, function (err, user) {
                if (err)
                    res.send(err);

                user.role = "user";
                user.teacher = undefined;// update the bears info
                user.save(function (err) {
                    if (err)
                        res.send(err);

                    res.send("Delete teacher and change to user role");
                });

            });
        });

    });

router.route('/users')  // get all the users //admin api
    .get(isAdmin, function (req, res) {
        User.find(function (err, users) {
            if (err)
                res.send(err);

            res.json(users);
        });
    });

router.route('/users/:user_id')
    .get(isLoggedIn, function (req, res) {  //get a user's info //user api
        User.findById(req.params.user_id, function (err, user) {
            if (err)
                res.send(err);
            res.json(user);
        });
    })

    .delete(isAdmin, function (req, res) { //delete a user //admin api
        User.findById(req.params.user_id, function (err, user) {
            switch (user.role) {
                case "admin":
                    res.send("Admin cannot be deleted");
                    break;
                default:
                    User.remove({_id: req.params.user_id}, function (err, user) {
                        if (err)
                            res.send(err);

                        res.json({message: 'Successfully deleted user'});
                    });
            }
        });
    });


router.route('/students')  //get all students //admin api
    .get(isAdmin, function (req, res) {
        Student.find(function (err, students) {
            if (err)
                res.send(err);

            res.json(students);
        });
    });

router.route('/students/query/:query')  //query students with their name //user api
    .get(isLoggedIn, function (req, res) {
        var query = req.params.query;
        if (query == "all") {
            Student.find(
                {}, "_id name schoolId", //以後可以包括班級，便於辨別重名學生
                function (err, students) {
                    res.json(students);
                }
            );
        } else {
            Student.find(
                {"name": {"$regex": req.params.query, "$options": "i"}},
                function (err, students) {
                    res.json(students);
                }
            );
        }
    });

router.route('/studentgroups') //get student's groups //student api
    .get(isStudent, function (req, res) {

        var studentid = req.user.student;
        Group.find({'students.id': studentid}, '_id name notice').lean().exec(function (err, groups) {
            if (err) res.send(err);

            res.json(groups);
        })

    });

router.route('/user/info')
    .get(function (req, res) {

        User.findById(req.user.id, {"local.password": 0}, function (err, user) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.json(user)
            }
        });

    });
module.exports = router;

// 旧的session认证取消，使用新的token认证
function isLoggedIn(req, res, next) {
    if (req.user) {
        return next();
    } else {
        res.status(401).send({
            permission: false,
            message: 'permission denied'
        });
    }
}

function isAdmin(req, res, next) {
    if (req.user.role == "admin") {
        return next();
    } else {
        res.status(401).send({
            permission: false,
            message: 'permission denied'
        });
    }
}

function isTeacher(req, res, next) {
    if (req.user.role == "teacher") {
        return next();
    } else {
        res.status(401).send({
            permission: false,
            message: 'permission denied'
        });
    }
}

function isStudent(req, res, next) {
    if (req.user.role == "student") {
        return next();
    } else {
        res.status(401).send({
            permission: false,
            message: 'permission denied'
        });
    }
}
