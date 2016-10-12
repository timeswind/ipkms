var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var tokenManager = require('../config/token_manager');
var _ = require('lodash');
var path = require('path');

var Student = require('../models/student');
var User = require('../models/localuser');
router.get('/', function (req, res) {
  res.render('index');
});

router.get('/error', function (req, res) {
  res.send('errors');
});

router.get('/profile', isLoggedIn, function (req, res) {
  res.sendFile(path.join(__dirname, '../../client/public/static/profile/profile.html'));
});

router.get('/quickquiz', function (req, res) {
  // @params req.query.id the quickquizId
  if (_.has(req.query, 'id')) {
    res.sendFile(path.join(__dirname, '../../client/public/static/quickquiz/quickquiz.html'));
  } else {
    res.send('params missing')
  }
});


module.exports = router;

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
  return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}

function isAdmin(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
  if (req.user.local.role == "admin")
  return next();
  // if they aren't redirect them to the home page
  res.redirect('/home');
}
