var express = require('express');
var router = express.Router();
var passport = require('passport');
// var passportLinkedIn = require('../auth/linkedin');
// var Teacher = require('../models/teacher');
// var User = require('../models/localuser');

router.get('/', function(req, res, next) {
  var user;
  if (req.user) {
    user = req.user;
    if (req.user.local.role == "teacher"){
      res.redirect('/home/teacher');
    }else{
      res.render('home', { title: 'Home', user: user });
    }
  }else{
    res.render('home', { title: 'Home', user: user });
  }
});

router.get('/teacher', function(req, res, next) {
  var user;
// uncommon after release
//   if(req.user){
//     if(req.user.local.role == "teacher"){
//       user = req.user;
//       res.render('home-teacher', { title: 'Home', user: user});
//     }else{
//       res.redirect('/home');
//     }
//   }else{
//     res.redirect('/');
//   }

res.render('home-teacher', { title: 'Home', user: user});


});

router.get('/teacher/managehomework', function(req, res, next) {
var user = req.user;
res.render('manage-homework', { title: 'Home', user: user});

});

router.get('/teacher/managegroups', function(req, res, next) {
var user = req.user;
res.render('manage-groups', { title: 'Home', user: user});

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
  res.redirect('/profile');
}
