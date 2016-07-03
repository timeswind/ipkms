var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var tokenManager = require('../config/token_manager');
var _ = require('lodash');

var Student = require('../models/student');

router.get('/', function (req, res) {
    res.render('index');
});

router.get('/error', function (req, res) {
    res.send('errors');
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local-login', function (err, user) {
        if (err) {
            return res.status(401).json({success: 0, error: 'username or password incorrect'});
        }
        if (!user) {
            return res.status(401).json({success: 0, error: 'username or password incorrect'});
        }
        req.logIn(user, function (err) {
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
                //user has authenticated correctly thus we create a JWT token
                token = jwt.sign(payload, user.local.password, {
                    expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
                });

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
                            var token = jwt.sign(payload, user.local.password, {
                                expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
                            });

                            return res.json({token: token});
                        }
                    })
                } else {
                    token = jwt.sign(payload, user.local.password, {
                        expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
                    });

                    return res.json({token: token});
                }

            } else {
                payload = {
                    id: user._id,
                    name: user.local.name,
                    email: user.local.email,
                    role: user.local.role
                };
                //user has authenticated correctly thus we create a JWT token
                token = jwt.sign(payload, user.local.password, {
                    expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
                });

                return res.json({token: token});
            }

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
                            var token = jwt.sign(payload, user.local.password, {
                                expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
                            });

                            return res.json({token: token});
                        }
                    })
                } else {
                    token = jwt.sign(payload, user.local.password, {
                        expiresIn: tokenManager.TOKEN_EXPIRATION_SEC // expires duration
                    });

                    return res.json({token: token});
                }
            } else {
                return res.status(401).json("this is not a student account");
            }
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

router.get('/quickquiz', function (req, res) {
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

// function isStudent(req, res, next) {
//     // if user is authenticated in the session, carry on
//     if (req.isAuthenticated())
//         if (req.user.local.role == "student")
//             return next();
//     // if they aren't redirect them to the home page
//     res.redirect('/home');
// }

// function studentToken(req, res, next) {
//     var token = req.body.token || req.query.token || req.headers['x-access-token'];
//
//     if (token) {
//         var firstDecoded = jwt.decode(token, {complete: true});
//         var userid = firstDecoded.payload.id;
//
//         User.findById(userid, function (err, user) {
//             if (err) {
//                 return res.json({success: false, message: '用户未找到'});
//             } else {
//                 jwt.verify(token, user.local.password, function (err, decoded) {
//                     if (err) {
//                         return res.json({success: false, message: '認證失敗'});
//                     } else {
//                         req.user = decoded;
//                         next();
//                     }
//                 });
//             }
//
//         });
//
//         return res.status(401).send({
//             authorize: false,
//             message: '认证失败'
//         });
//
//     }
// }
