'use strict';
var express = require('express');
var router = express.Router();
var tokenManager = require('../config/token_manager');
var _ = require('lodash');

var User = require('../models/user');

var messageApiRoutes = require('./apis/message.js');
var manageAccountApiRoutes = require('./apis/manage-account.js');
var manageQuestionApiRoutes = require('./apis/manage-question.js');
var manageQcollectonApiRoutes = require('./apis/manage-qcollection.js');
var manageGroupApiRoutes = require('./apis/manage-group.js');
var manageQuickquizApiRoutes = require('./apis/manage-quickquiz.js');
var manageHomeworkApiRoutes = require('./apis/manage-homework.js');
var qiniuApiRoutes = require('./apis/qiniu.js');

router.use('/message', tokenManager.verifyToken, messageApiRoutes);
router.use('/manage-account', tokenManager.verifyToken, manageAccountApiRoutes);
router.use('/manage-question', tokenManager.verifyToken, manageQuestionApiRoutes);
router.use('/manage-qcollection', tokenManager.verifyToken, manageQcollectonApiRoutes);
router.use('/manage-group', tokenManager.verifyToken, manageGroupApiRoutes);
router.use('/manage-quickquiz', tokenManager.verifyToken, manageQuickquizApiRoutes);
router.use('/manage-homework', tokenManager.verifyToken, manageHomeworkApiRoutes);
router.use('/qiniu', tokenManager.verifyToken, qiniuApiRoutes);

// router.route('/createAdmin')
// .get(function(req, res){
//   var newUser = new User()
//   newUser.name = "Mingtian Yang";
//   newUser.email = "tswymt@gmail.com";
//   newUser.school = "pkms";
//   newUser.role = 'admin';
//   newUser.password = newUser.generateHash("123456"); //默认密码123456
//   newUser.save(function (err) {
//     if (err) {
//       res.status(400).send(err.message);
//     } else {
//       res.send('success')
//     }
//   })
// })

router.route('/login')
.post(function (req, res, next) {
  var requiredParams = ['school', 'password']
  var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));
  if (paramsComplete) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var data = _.pick(req.body, ['school', 'email', 'schoolId', 'password'])
    if (data.email && re.test(data.email)) {
      console.log(data.school)
      console.log(data.email)
      User.findOne({school: data.school, email: data.email}, function (err, user) {
        if (err) {
          res.status(400).json({success: false, error: err.message})
        } else if (!user) {
          res.status(400).json({success: false, error: "username and password don't match"})
        } else if (!user.validPassword(data.password)) {
          res.status(400).json({success: false, error: "username and password don't match"})
        } else {
          var payload = {
            id: user._id,
            school: user.school,
            name: user.name,
            email: user.email,
            role: user.role
          };
          var token = tokenManager.signToken(payload)
          res.json({token: token, role: user.role});
        }
      });
    } else if (data.schoolId && !isNaN(data.schoolId)) {
      User.findOne({school: data.school, schoolId: data.schoolId}, function (err, user) {
        if (err) {
          res.status(400).json({success: false, error: err.message})
        } else if (!user) {
          res.status(400).json({success: false, error: "username and password don't match"})
        } else if (!user.validPassword(data.password)) {
          res.status(400).json({success: false, error: "username and password don't match"})
        } else {
          var payload = {
            id: user._id,
            school: user.school,
            name: user.name,
            email: user.email,
            role: user.role
          };
          var token = tokenManager.signToken(payload)
          res.json({token: token, role: user.role});
        }
      });
    } else {
      res.status(400).json({success: false, error: "login fail"})
    }
  } else {
    res.status(400).json({success: false, error: "Params missing"})
  }
});

module.exports = router;
