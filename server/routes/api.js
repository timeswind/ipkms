'use strict';
var async = require("async");
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var tokenManager = require('../config/token_manager');

var Teacher = require('../models/teacher');
var Student = require('../models/student');
var User = require('../models/localuser');

var messageApiRoutes = require('./apis/message.js');
var manageAccountApiRoutes = require('./apis/manage-account.js');
var manageQuestionApiRoutes = require('./apis/manage-question.js');
var manageQcollectonApiRoutes = require('./apis/manage-qcollection.js');
var manageGroupApiRoutes = require('./apis/manage-group.js');
var manageQuickquizApiRoutes = require('./apis/manage-quickquiz.js');
var manageHomeworkApiRoutes = require('./apis/manage-homework.js');

var validUserRole = require("../auth/validUserRole");
var isLoggedIn = validUserRole.isLoggedIn;
var isAdmin = validUserRole.isAdmin;

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
