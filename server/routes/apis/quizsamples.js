'use strict';
var express = require('express');
var router = express.Router();
var redisClient = require('../../config/redis_database').redisClient;

var Quizsample = require('../../models/quizsample');
var validUserRole = require("../../auth/validUserRole");
var isStudent = validUserRole.isStudent;

router.route('/')
.get(isStudent, function (req, res) {
  let student = req.user.id
  Quizsample.find({student: student}).populate('quickquiz', 'title duration').lean().exec(function (err, samples) {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.json({success: true, quizsamples: samples})
    }
  })
});

module.exports = router;
