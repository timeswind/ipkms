'use strict';
var express = require('express');
var router = express.Router();
var redisClient = require('../../config/redis_database').redisClient;

var Quizsample = require('../../models/quizsample');
var validUserRole = require("../../auth/validUserRole");
var isStudent = validUserRole.isStudent;
var isLoggedIn = validUserRole.isLoggedIn;

router.route('/')
.get(isStudent, function (req, res) {
  let student = req.user.id
  Quizsample.find({student: student}).populate('quickquiz', 'title duration endAt').lean().exec(function (err, samples) {
    if (err) {
      res.status(500).send(err.message)
    } else {
      res.json({success: true, quizsamples: samples})
    }
  })
});

router.route('/:id')
.get(isLoggedIn, function (req, res) {
  let role = req.user.role
  let user_id = req.user.id
  let quizsample_id = req.params.id
  Quizsample.findOne({'_id': quizsample_id}).lean().exec(function (err, sample) {
    if (err) {
      res.status(500).send(err.message)
    } else {
      if (role === 'student') {
        if (sample.student == user_id) {
          res.json({success: true, quizsample: sample})
        } else {
          res.json({success: false, error: 'permission denied'})
        }
      } else {
        res.json({success: true, quizsample: sample})
      }
    }
  })
});

module.exports = router;
