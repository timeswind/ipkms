var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var tokenManager = require('../config/token_manager');


router.get('/', function (req, res) {
    res.render('index');
});

router.get('/error', function (req, res) {
    res.send('errors');
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local-login', function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json("FAIL");
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }

            var payload;
            var userRole = req.user.local.role;

            if (userRole == "teacher") {
                payload = {
                    id: user._id,
                    name: user.local.name,
                    email: user.local.email,
                    teacher: user.local.teacher,
                    role: "teacher"
                }
            } else if (userRole == "student") {
                payload = {
                    id: user._id,
                    name: user.local.name,
                    schoolid: user.local.schoolId,
                    student: user.local.student,
                    role: "student"
                }
            } else {
                payload = {
                    id: user._id,
                    name: user.local.name,
                    email: user.local.email,
                    role: user.local.role
                }
            }

            //user has authenticated correctly thus we create a JWT token
            var token = jwt.sign(payload, user.local.password, {
                expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
            });

            return res.json({token: token});
        });
    })(req, res, next);
});

router.post('/login/student', function (req, res, next) {
    passport.authenticate('local-student-login', function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json("student login fail");
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }

            var payload;
            var userRole = req.user.local.role;

            if (userRole == "student") {
                payload = {
                    id: user._id,
                    name: user.local.name,
                    schoolid: user.local.schoolId,
                    student: user.local.student,
                    role: "student"
                }
            } else {
                return res.status(401).json("this is not a student account");
            }

            var token = jwt.sign(payload, user.local.password, {
                expiresIn: tokenManager.TOKEN_EXPIRATION_SEC
            });

            return res.json({token: token});
        });
    })(req, res, next);
});

router.get('/chatroom', isLoggedIn, function (req, res) {
    res.render('chatroom/chatroom', {user: req.user});
});

router.get('/logout', function (req, res) {
    tokenManager.expireToken(req);
    req.logout();
    res.redirect('/');
});

router.get('/admin', isAdmin, function (req, res) {

    res.render('admin/index');

});

router.get('/quickquiz',isStudent, function (req, res) {
    console.log(req.query);
    // @params req.query.id the quickquizId
    if (req.query && req.query.id) {
        res.render('quickquiz/index')
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

function isStudent(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        if (req.user.local.role == "student")
            return next();
    // if they aren't redirect them to the home page
    res.redirect('/home');
}
