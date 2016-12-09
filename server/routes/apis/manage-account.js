var _ = require('lodash');
var async = require("async");
var express = require('express');
var router = express.Router();
var User = require('../../models/user');
var validUser = require('../../auth/validUserRole');
var isAdmin = validUser.isAdmin;
var isLoggedIn = validUser.isLoggedIn;

router.route('/users')
.post(isAdmin, function(req, res) {
  let school = req.user.school
  var requiredParams = ['role', 'password', 'name'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));
  if (paramsComplete) {
    let role = req.body.role
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (role === 'teacher' && _.has(req.body, 'email') && re.test(req.body.email)) {
      async.waterfall([
        function(callback) {
          User.findOne({school: school, email: req.body.email}, function(err, user) {
            if (err) {
              callback(err)
            } else {
              if (user) {
                callback(new Error('User Already Exist'))
              } else {
                callback(null)
              }
            }
          })
        },
        function(callback) {
          var newUserTeacher = new User()
          newUserTeacher.role = 'teacher'
          newUserTeacher.school = school
          newUserTeacher.email = req.body.email
          newUserTeacher.name = req.body.name
          newUserTeacher.password = newUserTeacher.generateHash(req.body.password)
          newUserTeacher.save(function(err) {
            if (err) {
              callback(err)
            } else {
              callback(null, 'success')
            }
          })
        }
      ], function (err, result) {
        if (err) {
          res.status(500).send(err.message)
        } else {
          res.json({success: true})
        }
      });
    } else if (role === 'student' && _.has(req.body, 'schoolId') && !isNaN(req.body.schoolId) ) {
      async.waterfall([
        function(callback) {
          User.findOne({school: school, schoolId: req.body.schoolId}, function(err, user) {
            if (err) {
              callback(err)
            } else {
              if (user) {
                callback(new Error('User Already Exist'))
              } else {
                callback(null)
              }
            }
          })
        },
        function(callback) {
          var newUserStudent = new User()
          newUserStudent.role = 'student'
          newUserStudent.school = school
          newUserStudent.schoolId = req.body.schoolId
          newUserStudent.name = req.body.name
          newUserStudent.password = newUserStudent.generateHash(req.body.password)
          newUserStudent.save(function(err) {
            if (err) {
              callback(err)
            } else {
              callback(null, 'success')
            }
          })
        }
      ], function (err, result) {
        if (err) {
          res.status(400).send(err.message)
        } else {
          res.json({success: true})
        }
      });
    } else {
      res.status(400).send('bad params')
    }
  } else {
    res.status(400).send('params missing')
  }
})

router.route('/user/:id')
.get(isAdmin, function(req, res) {
  let user_id = req.params.id
  let school = req.user.school
  console.log(req.user)
  User.findOne({"_id": user_id}, 'school name schoolId email role').lean().exec(function (err, user) {
    if (err) {
      res.status(500).send(err.message)
    } else {
      console.log(user.school)
      if (user.school === school) {
        res.json({success: true, user: user})
      } else {
        res.status(400).send('permission denied')
      }
    }
  })
})

router.route('/students')
.get(isAdmin, function (req, res) {
  var school = req.user.school
  if (req.query.name) {
    User.find({school: school, role: 'student', name: {$regex: req.query.name}}, 'name role schoolId').lean().exec(function (err, students) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json({success: true, users: students});
      }
    })
  } else if (req.query.schoolId) {
    User.find({school: school, schoolId: {$regex: req.query.schoolId}}, 'name role schoolId').lean().exec(function (err, students) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json({success: true, users: students});
      }
    })
  } else {
    res.status(400).send('missing params')
  }
})

router.route('/students/:user_id')
.get(isAdmin, function (req, res) {
  /**
  * @param {string} req.params.user_id - user ID
  */
  if (_.has(req.params, 'user_id')) {
    var user_id = req.params.user_id;
    User.findById(user_id, 'name schoolId class', function (err, student) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json(student)
      }
    })
  } else {
    res.status(400).send("No student id provided")
  }
})
.put(isAdmin, function (req, res) {
  /**
  * @param {string} req.params.user_id - user_id ID
  */
  /**
  * @param {string} req.body.name - student name
  */
  /**
  * @param {string} req.body.schoolId - student schoolid
  */
  /**
  * @param {number} req.body.grade
  */
  /**
  * @param {string} req.body.class
  */

  var requiredParams = ['name', 'schoolId', 'class'];
  var paramsComplete = _.every(requiredParams, _.partial(_.has, req.body));

  if (_.has(req.params, 'user_id') && paramsComplete) {
    var user_id = req.params.user_id;
    var updatedObject = {
      "name": req.body.name,
      "schoolId": req.body.schoolId, //pre save? check repeat
      "class": req.body.class
    };
    User.findOneAndUpdate({_id: user_id}, updatedObject, {new: true}, function (err, student) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json(student)
      }
    })
  } else {
    res.status(400).send("params missing")
  }
});

router.route('/users/reset-password/:user_id')
.post(isAdmin, function (req, res) {
  /**
  * @param {string} req.params.user_id - Student ID
  */
  /**
  * @param {string} req.body.password - new password
  */

  if (_.has(req.params, 'user_id') && _.has(req.body, 'password')) {
    var school = req.user.school;
    var user_id = req.params.user_id;
    var newpassword = req.body.password;
    if (newpassword.trim() !== '') {
      User.findOne({'_id': user_id}, function (err, user) {
        if (err) {
          res.status(500).send(err.message)
        } else {
          if (user.school === school) {
            user.password = user.generateHash(newpassword)
            user.save(function(err){
              if (err) {
                res.status(500).send(err.message)
              } else {
                res.send({success: true})
              }
            })
          } else {
            res.status(400).send('permission denied')
          }
        }
      })
    } else {
      res.status(400).send('invaild password')
    }
  } else {
    res.status(400).send('params missing')
  }


})

router.route('/teachers')
.get(isAdmin, function (req, res) {
  /**
  * @param {string} req.query.name - teacher name
  */
  /**
  * @param {string} req.query.email - teacher email
  */
  var school = req.user.school
  var name = req.query.name;
  var email = req.query.email;

  if (_.get(req.query, 'name', '') !== '') {
    if (_.get(req.query, 'email', '') !== '') {
      User.find({school: school, role: 'teacher', $or: [{name: {$regex: name}}, {email: {$regex: email}}]}, 'name email role', function (err, teachers) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({success: true, users: teachers});
        }
      })
    } else {
      User.find({school: school, role: 'teacher', name: {$regex: name}}, 'name email role', function (err, teachers) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({success: true, users: teachers});
        }
      })
    }
  } else if (_.get(req.query, 'email', '') !== '') {
    User.find({school: school, role: 'teacher', email: {$regex: email}}, 'name email role', function (err, teachers) {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json({success: true, users: teachers});
      }
    })
  }
})
.delete(isAdmin, function (req, res) {
  /**
  * @param {string} req.body.user_id - user ID
  */
  var user_id = req.query.user_id;
  User.findOneAndRemove({'_id': user_id}, function (err) {
    if (err) {
      send.status(500).send(err.message)
    } else {
      res.json('success')
    }
  })
})

router.route('/teachers/:user_id')
.get(isAdmin, function (req, res) {
  /**
  * @param {string} req.params.user_id - user ID
  */
  if (_.has(req.params, 'user_id')) {
    var user_id = req.params.user_id;

    User.findById(user_id, 'name email', function (err, teacher) {
      if (err) {
        res.status(500).send(err.message)
      } else {
        res.json(teacher)
      }
    })
  } else {
    res.status(400).send("params missing")
  }
})

module.exports = router;
