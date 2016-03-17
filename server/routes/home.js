var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');

var Teacher = require('../models/teacher');
var User = require('../models/localuser');

router.get('/', isLoggedIn, function(req, res, next) {
  var user;
  if (req.user) {
    role = req.user.local.role;
    if (role === "teacher"){
      res.redirect('/home/teacher');
    }else if (role === "admin"){
      res.redirect('/admin');
    }else{
      res.render('home', { title: 'Home', user: user });
    }
  }else{
    res.status(403)
  }
});

router.get('/teacher', isTeacher, function(req, res, next) {
  var user;
  res.render('home-teacher', { title: 'Home', user: user});

});

router.get('/teacher/managehomework', isTeacher, function(req, res, next) {
  var user = req.user;
  res.render('manage-homework', { title: '管理功課', user: user});

});

router.get('/teacher/managegroups', isTeacher, function(req, res, next) {
  var user = req.user;
  res.render('manage-groups', { title: '管理小組', user: user});

});

router.get('/teacher/questions', isTeacher, function(req, res, next) {
  var user = req.user;
  res.render('questions', { title: '題庫', user: user});

});

router.get('/teacher/questions/manage-questions', isTeacher, function(req, res, next) {
  var user = req.user;
  res.render('manage-questions', { title: '管理題目', user: user});

});

router.get('/teacher/questions/manage-qcollections', isTeacher, function(req, res, next) {
  var user = req.user;
  res.sendFile(path.join(__dirname, '../../client/public/home/teacher/questions/manage-qcollection/index.html'));

});

router.get('/student/mygroups', isStudent, function(req, res, next) {
  var user = req.user;
  res.render('my-groups');

});

module.exports = router;

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()){
    return next();
  }else{
    // if they aren't redirect them to the home page
    res.redirect('/');
  }
}

function isAdmin(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
  if (req.user.local.role == "admin")
  return next();
  // if they aren't redirect them to the home page
  res.redirect('/');
}

function isTeacher(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
  if (req.user.local.role == "teacher")
  return next();
  // if they aren't redirect them to the home page
  res.redirect('/home');
}

function isStudent(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
  if (req.user.local.role == "student")
  return next();
  // if they aren't redirect them to the home page
  res.redirect('/home');
}
