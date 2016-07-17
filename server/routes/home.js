var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');

router.get('/', isLoggedIn, function (req, res) {
    var user = req.user;
    if (user) {
        var role = user.local.role;
        if (role === "teacher") {
            res.redirect('/home/teacher');
        } else if (role === "admin") {
            res.redirect('/admin');
        } else if (role === "student") {
            res.redirect('/home/student');
        }
    } else {
        res.status(403)
    }
});

router.get('/teacher', isTeacher, function (req, res) {

    var user = req.user;
    res.render('teacher/home', {user: user});

});

router.get('/student', isStudent, function (req, res) {

    var user = req.user;
    res.render('student/home', {user: user});

});

router.get('/teacher/managehomework', isTeacher, function (req, res) {

    var user = req.user;
    res.render('teacher/manage-homework', {title: '管理功課', user: user});

});

router.get('/teacher/managegroups', isTeacher, function (req, res) {

    var user = req.user;
    res.render('teacher/manage-groups', {title: '管理小組', user: user});

});

router.get('/teacher/questions', isTeacher, function (req, res) {

    res.sendFile(path.join(__dirname, '../../client/public/home/question-library/index.html'));

});

router.get('/student/mygroups', isStudent, function (req, res) {

    var user = req.user;
    res.render('my-groups', {user: user});

});

module.exports = router;

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
        return next();
    } else {
        // if they aren't redirect them to the home page
        res.redirect('/');
    }
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
