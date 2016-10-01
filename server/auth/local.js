// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../models/localuser');
var Teacher = require('../models/teacher');
var Student = require('../models/student');
// expose this function to our app using module.exports
module.exports = function (passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL USER SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function (req, email, password, done) {

    // asynchronous
    // User.findOne wont fire unless data is sent back
    process.nextTick(function () {

      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      User.findOne({'local.email': email}, function (err, user) {
        // if there are any errors, return the error
        if (err)
        return done(err);

        // check to see if theres already a user with that email
        if (user) {
          return done(null, false);
        } else {

          // if there is no user with that email
          // create the user
          var newUser = new User();
          // set the user's local credentials
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);
          newUser.local.name = req.body.name;
          newUser.local.role = "user";

          // save the user
          newUser.save(function (err) {
            if (err)
            throw err;
            return done(null, newUser);
          });
        }

      });

    });

  }));

  // =========================================================================
  // LOCAL TEACHER SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-teacher-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function (req, email, password, done) {

    // asynchronous
    // User.findOne wont fire unless data is sent back
    process.nextTick(function () {

      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      User.findOne({'local.email': email}, function (err, user) {
        // if there are any errors, return the error
        if (err)
        return done(err);

        // check to see if theres already a user with that email
        if (user) {
          return done(null, false);
        } else {

          // if there is no user with that email
          // create the user
          var newUser = new User();
          var userId;
          // set the user's local credentials
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);
          newUser.local.name = req.body.name;
          newUser.local.role = "teacher";

          // save the user
          newUser.save(function (err, u) {
            userId = u.id;

            var newTeacher = new Teacher();
            newTeacher.user = userId;
            newTeacher.name = req.body.name;
            newTeacher.save();
            if (err)
            throw err;
            return done(null, newUser);
          });
        }

      });

    });

  }));

  // =========================================================================
  // LOCAL STUDENT SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-student-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'schoolId',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function (req, schoolId, password, done) {

    // asynchronous
    // User.findOne wont fire unless data is sent back
    process.nextTick(function () {

      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      User.findOne({'local.schoolId': schoolId}, function (err, user) {
        // if there are any errors, return the error
        if (err)
        return done(err);

        // check to see if theres already a user with that email
        if (user) {
          return done(null, false);
        } else {

          // if there is no user with that email
          // create the user
          var newUser = new User();
          // set the user's local credentials
          newUser.local.schoolId = schoolId;
          newUser.local.password = newUser.generateHash(password);
          newUser.local.name = req.body.name;
          newUser.local.role = "student";

          // save the user
          newUser.save(function (err, u) {

            var newStudent = new Student();
            newStudent.user = u.id;
            newStudent.schoolId = schoolId;
            newStudent.name = req.body.name;
            newStudent.save();
            if (err)
            throw err;
            return done(null, newUser);
          });
        }

      });

    });

  }));


  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function (req, email, password, done) { // callback with email and password from our form
    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({'local.email': email}, function (err, user) {
      // if there are any errors, return the error before anything else
      if (err)
      return done(err);

      // if no user is found, return the message
      if (!user)
      return done(null, false);

      // if the user is found but the password is wrong
      if (!user.validPassword(password))
      return done(null, false);

      return done(null, user);
    });

  }));

  passport.use('local-student-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'schoolid',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function (req, schoolid, password, done) { // callback with email and password from our form

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({'local.schoolId': schoolid}, function (err, user) {
      console.log(schoolid)
      // if there are any errors, return the error before anything else
      if (err)
      return done(err);

      // if no user is found, return the message
      if (!user)
      console.log('user not exist')
      return done(null, false);

      // if the user is found but the password is wrong
      if (!user.validPassword(password))
      console.log('wrong password')
      return done(null, false);

      // all is well, return successful user
      return done(null, user);
    });

  }));

};
