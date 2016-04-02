var async = require("async");
var express = require('express');
var router = express.Router();

var Teacher = require('../../models/teacher');
var Student = require('../../models/student');
var User = require('../../models/localuser');

router.route('/students')
.get(isAdmin, function(req, res) {
  var name = req.query.name;
  var schoolId = req.query.schoolId;

  Student.find({name: { $regex: name }, schoolId: { $regex: schoolId }}, 'name class schoolId', function(err, students){
    if (err) { res.send(err.message) } else { res.json(students); }
  })
})
.post(isAdmin, function(req, res) {
  var name = req.body.name;
  var schoolId = req.body.schoolId;
  var grade = req.body.grade;
  var theclass = req.body.class; //不能用class，与js中的class重名

  var newStudent = new Student();
  newStudent.name = name;
  newStudent.schoolId = schoolId;
  newStudent.grade = grade;
  newStudent.class = theclass;

  newStudent.save(function(err, s) {
    if (err) { res.status(406).send(err.message); } else {
      var newUser = new User();
      newUser.local.name = s.name;
      newUser.local.schoolId = s.schoolId;
      newUser.local.role = 'student';
      newUser.local.student = s.id;
      newUser.local.password = newUser.generateHash("123456"); //默认密码123456
      newUser.save(function(err) {
        if (err) { res.status(406).send(err.message); } else { res.json('success') }
      })
    }
  })
})
.delete(isAdmin, function(req, res){
  var student_id = req.body.student_id;
  User.find({'local.student': student_id}).remove(function(err){
    if (err) {send.status(500).send(err.message)} else {
      Student.findByIdAndRemove(student_id, function(err){
        if (err) {send.status(500).send(err.message)} else {
          res.json('success')
        }
      })
    }
  })
})

router.route('/students/:student_id')
.get(isAdmin, function(req, res) {
  var student_id = req.params.student_id
  if (student_id) {
    Student.findById(student_id, 'name schoolId class grade', function (err, student) {
      if (err) { res.status(500).send(err.message) } else {
        res.json(student)
      }
    })
  } else {
    res.status(400).send("No student id provided")
  }
})
.put(isAdmin, function(req, res) {
  var student_id = req.body.student_id
  if (student_id) {
    var updatedObject = {
      "name": req.body.name,
      "schoolId": req.body.schoolId, //pre save? check repeat
      "grade": req.body.grade,
      "class": req.body.class
    }
    Student.findOneAndUpdate({ _id: student_id }, updatedObject, {new: true}, function (err, student) {
      if (err) { res.status(500).send(err.message) } else {
        res.json(student)
      }
    })
  } else {
    res.status(400).send("update fail, no student id provided")
  }
})

router.route('/students/reset-password/:student_id')
.get(isAdmin, function(req, res) {
  var student_id = req.params.student_id
  User.findOne({'local.student': student_id}, 'local.name local.role', function(err, user) {
    if (err) {res.status(500).send(err.message)} else {
      res.json(user)
    }
  })
})
.post(isAdmin, function(req, res) {
  var student_id = req.params.student_id
  var password = req.body.password

  if (password.trim() !== '') {
    var updatedObject = {
      'local.password': User().generateHash(password)
    }
    User.findOneAndUpdate({'local.student': student_id}, updatedObject, { new: true }, function(err, user) {
      if (err) {res.status(500).send(err.message)} else {
        res.send('reset password success')
      }
    })
  } else {
    res.status(406).send('invaild password')
  }
})

router.route('/teachers')
.get(isAdmin, function(req, res) {
  var name = req.query.name;
  var email = req.query.email;
  Teacher.find({ name: { $regex: name }, email: { $regex: email } }, 'name email', function(err, teachers){
    if (err) { res.status(406).send(err.message); } else { res.json(teachers); }
  })
})
.post(isAdmin, function(req, res) {
  console.log(req.body);

  var name = req.body.name;
  var email = req.body.email;

  var newTeacher = new Teacher();
  newTeacher.name = name;
  newTeacher.email = email;

  newTeacher.save(function(err, t) {
    if (err) { res.status(406).send(err.message); } else {
      var newUser = new User();
      newUser.local.name = t.name;
      newUser.local.email = t.email;
      newUser.local.role = 'teacher';
      newUser.local.teacher = t.id;
      newUser.local.password = newUser.generateHash("123456"); //默认密码123456
      newUser.save(function(err) {
        if (err) { res.status(406).send(err.message); } else { res.json('success') }
      })
    }
  })
})
.delete(isAdmin, function(req, res){
  var teacher_id = req.body.teacher_id;
  User.find({'local.teacher': teacher_id}).remove(function(err){
    if (err) {send.status(500).send(err.message)} else {
      Teacher.findByIdAndRemove(teacher_id, function(err){
        if (err) {send.status(500).send(err.message)} else {
          res.json('success')
        }
      })
    }
  })
})

router.route('/teachers/:teacher_id')
.get(isAdmin, function(req, res) {
  var teacher_id = req.params.teacher_id
  if (teacher_id) {
    Teacher.findById(teacher_id, 'name email', function (err, teacher) {
      if (err) { res.status(500).send(err.message) } else {
        res.json(teacher)
      }
    })
  } else {
    res.status(400).send("no teacher id provided")
  }
})

router.route('/teachers/reset-password/:teacher_id')
.get(isAdmin, function(req, res) {
  var teacher_id = req.params.teacher_id
  User.findOne({'local.teacher': teacher_id}, 'local.name local.role', function(err, user) {
    if (err) {res.status(500).send(err.message)} else {
      res.json(user)
    }
  })
})
.post(isAdmin, function(req, res) {
  var teacher_id = req.params.teacher_id
  var password = req.body.password
  if (password.trim() !== '') {
    var updatedObject = {
      'local.password': User().generateHash(password)
    }
    User.findOneAndUpdate({'local.teacher': teacher_id}, updatedObject, { new: true }, function(err, user) {
      if (err) {res.status(500).send(err.message)} else {
        res.send('reset password success')
      }
    })
  } else {
    res.status(406).send('invaild password')
  }
})

//根据用户创建/删除教师角色
router.route('/user-teacher')
.post(isAdmin, function(req, res) {
  if (Object.keys(req.body)[0]) {
    var user_id = Object.keys(req.body)[0];

    async.waterfall([
      validate,
      newTeacher,
      updateUser,
    ], function (err, result) {
      if (result) {
        res.send("success");
      }
    });

    function validate(callback) {
      User.findById(user_id, function(err, user){
        if(err) res.send(err);

        if (user.local.role !== "teacher" || !user.local.teacher) {
          callback(null, user.local.name);
        } else {
          res.status(500);
        }
      })
    }
    function newTeacher(name, callback) {
      var newTeacher = new Teacher();
      newTeacher.user = user_id;
      newTeacher.name = name;
      newTeacher.save(function(err, t){
        if(err)
        res.send(err);

        callback(null, t.id);
      })
    }
    function updateUser(teacher_id, callback) {

      User.findByIdAndUpdate(user_id, { $set: { 'local.role': 'teacher', 'local.teacher': teacher_id } },function(err){
        if(err) res.send(err);

        callback(null, 'success');
      })
    }
  } else {
    res.status(500);
  }

})
.delete(isAdmin, function(req, res) {
  if (Object.keys(req.body)[0]) {
    var user_id = Object.keys(req.body)[0];

    async.waterfall([
      validate,
      deleteTeacher,
      updateUser,
    ], function (err, result) {
      if (result) {
        res.send("success");
      }
    });

    function validate(callback) {
      User.findById(user_id, function(err, user){
        if(err) res.send(err);

        if (user.local.role == "teacher" && user.local.teacher) {
          callback(null, user.local.teacher);
        } else {
          res.status(500);
        }
      })
    }
    function deleteTeacher(teacher_id, callback) {
      Teacher.findByIdAndRemove(teacher_id, function (err){
        if(err) res.send(err);

        callback(null);
      })
    }
    function updateUser(callback) {

      User.findByIdAndUpdate(user_id, { $set: { 'local.role': 'user', 'local.teacher': undefined } },function(err){
        if(err) res.send(err);

        callback(null, 'success');
      })
    }

  } else {
    res.status(500);
  }
})

module.exports = router;

function isLoggedIn(req, res, next) {

  if (req.user){
    return next();
  }else{
    res.status(401);
  }
}

function isAdmin(req, res, next) {

  if (req.user.role == "admin"){
    return next();
  }else{
    res.status(401);
  }
}

function isTeacher(req, res, next) {

  if (req.user.role == "teacher"){
    return next();
  }else{
    res.status(401);
  }
}

function isStudent(req, res, next) {

  if (req.user.role == "student"){
    return next();
  }else{
    res.status(401);
  }
}
