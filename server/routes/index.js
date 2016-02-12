var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
// var passportLinkedIn = require('../auth/linkedin');
var Teacher = require('../models/teacher');
var User = require('../models/localuser');


router.get('/', function(req, res, next) {
  var user;
  if (req.user) {
    user = req.user;
  }
  res.render('index', { title: 'Myhomework', user: user });
});

router.get('/login', function(req, res, next) {
  res.send('Go back and register!');
});

router.get('/error', function(req, res, next) {
  res.send('errors');
});

router.post('/login',function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.status(401).json("fail"); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }

      var payload;
      var userRole = req.user.local.role;

      if (userRole == "teacher") {
        payload = {
          id : user._id,
          name : user.local.name,
          email : user.local.email,
          teacher : user.local.teacher,
          role : "teacher"
        }
      } else if (userRole == "student") {
        payload = {
          id : user._id,
          name : user.local.name,
          schoolid : user.local.schoolId,
          student : user.local.student,
          role : "student"
        }
      } else {
        payload = {
          id : user._id,
          name : user.local.name,
          email : user.local.email,
          role : user.local.role
        }
      }

      //user has authenticated correctly thus we create a JWT token
      var token = jwt.sign(payload, user.local.password, {
        expiresIn: 60*60*24 // expires in 24 hours
      });

      return res.json({ token : token });
    });
  })(req, res, next);
});

router.post('/ios/login', passport.authenticate('local-login', {
  successRedirect : '/ios/login/success', // redirect to the secure profile section
  failureRedirect : '/ios/login/fail', // redirect back to the signup page if there is an error
}));

router.get('/ios/login/success', isLoggedIn, function(req, res, next) {
  res.json(1);
});

router.get('/ios/login/fail', function(req, res, next) {
  res.json(0);
});

router.post('/login/student', passport.authenticate('local-student-login', {
  successRedirect : '/home', // redirect to the secure profile section
  failureRedirect : '/login', // redirect back to the signup page if there is an error
}));

router.post('/signup/teacher', passport.authenticate('local-teacher-signup', { //isAdmin production need
  successRedirect : '/admin', // redirect to the secure profile section
  failureRedirect : '/error', // redirect back to the signup page if there is an error
}));

router.post('/signup/user', passport.authenticate('local-signup', { //isAdmin production need
  successRedirect : '/admin', // redirect to the secure profile section
  failureRedirect : '/error', // redirect back to the signup page if there is an error
}));

router.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile', { message: 'Login success', user: req.user });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});



// router.get('/auth/linkedin', passportLinkedIn.authenticate('linkedin'));

// router.get('/auth/linkedin/callback',
//   passportLinkedIn.authenticate('linkedin', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication
//     res.json(req.user);
//   });

router.get('/admin', isAdmin, function(req, res) {  //not production！！需要添加权限检查 isAdmin

  res.render('admin', { message: 'Welcome back, Chuck!'});

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
