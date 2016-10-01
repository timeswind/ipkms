'use strict';
var async = require("async");
var express = require('express');
var router = express.Router();
var passport = require('passport');
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
var qiniuApiRoutes = require('./apis/qiniu.js');

var validUserRole = require("../auth/validUserRole");
var isLoggedIn = validUserRole.isLoggedIn;
var isAdmin = validUserRole.isAdmin;

router.use('/message', tokenManager.verifyToken, messageApiRoutes);
router.use('/manage-account', tokenManager.verifyToken, manageAccountApiRoutes);
router.use('/manage-question', tokenManager.verifyToken, manageQuestionApiRoutes);
router.use('/manage-qcollection', tokenManager.verifyToken, manageQcollectonApiRoutes);
router.use('/manage-group', tokenManager.verifyToken, manageGroupApiRoutes);
router.use('/manage-quickquiz', tokenManager.verifyToken, manageQuickquizApiRoutes);
router.use('/manage-homework', tokenManager.verifyToken, manageHomeworkApiRoutes);
router.use('/qiniu', tokenManager.verifyToken, qiniuApiRoutes);

router.route('/login')
.post(function (req, res, next) {
  console.log('login')
  passport.authenticate('local-login', function (err, user) {
    if (err) {
      return res.status(401).json({success: 0, error: 'error, username or password incorrect'});
    }
    if (!user) {
      return res.status(401).json({success: 0, error: '1 username or password incorrect'});
    }
    req.logIn(user, function (err) {
      console.log(err)
      if (err) {
        return res.status(401).json({success: 0, error: 'username or password incorrect'});
      }

      var payload;
      var token;
      var userRole = req.user.local.role;

      if (userRole == "teacher") {
        payload = {
          id: user._id,
          name: user.local.name,
          email: user.local.email,
          teacher: user.local.teacher,
          role: "teacher"
        };
        token = tokenManager.signToken(payload)

        return res.json({token: token});
      } else if (userRole == "student") {
        var student_name = _.get(user.local, 'name', null);
        payload = {
          id: user._id,
          name: student_name,
          schoolid: user.local.schoolId,
          student: user.local.student,
          role: "student"
        };
        if (!student_name) {
          Student.findById(user.local.student).lean().exec(function (err, student) {
            if (err) {
              return res.status(500).send(err.message)
            } else {
              payload.name = student.name;
              token = tokenManager.signToken(payload)
              return res.json({token: token});
            }
          })
        } else {
          token = tokenManager.signToken(payload)

          return res.json({token: token});
        }

      } else {
        payload = {
          id: user._id,
          name: user.local.name,
          email: user.local.email,
          role: user.local.role
        };
        token = tokenManager.signToken(payload)

        return res.json({token: token});
      }

    });
  })(req, res, next);
});

router.route('/login/student')
.post(function (req, res, next) {
  passport.authenticate('local-student-login', function (err, user) {
    if (err) {
      return res.status(401).send('student login fail');
    }
    if (!user) {
      return res.status(401).send('student login fail');
    }
    req.logIn(user, function (err) {
      if (err) {
        return res.status(401).send('student login fail');
      }

      var payload;
      var userRole = req.user.local.role;
      var student_name = _.get(user.local, 'name', null);
      payload = {
        id: user._id,
        name: student_name,
        schoolid: user.local.schoolId,
        student: user.local.student,
        role: "student"
      };
      if (userRole == "student") {
        if (!student_name) {
          Student.findById(user.local.student).lean().exec(function (err, student) {
            if (err) {
              return res.status(500).send(err.message)
            } else {
              payload.name = student.name;
              var token = tokenManager.signToken(payload)
              return res.json({token: token});
            }
          })
        } else {
          var token = tokenManager.signToken(payload)
          return res.json({token: token});
        }
      } else {
        return res.status(401).json("this is not a student account");
      }
    });
  })(req, res, next);
});

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
