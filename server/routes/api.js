var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var tokenManager = require('../config/token_manager');

var Teacher = require('../models/teacher');
var Student = require('../models/student');
var User = require('../models/localuser');
var Group = require('../models/group')
var Thomework = require('../models/thomework');
var Shomework = require('../models/shomework');

router.use( tokenManager.verifyToken, function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {
    // get the decoded payload and header
    var firstdecoded = jwt.decode(token, {complete: true});
    console.log(firstdecoded.payload.id);
    var userid = firstdecoded.payload.id;

    User.findById(userid, function(err, user){
      if (err) {
        return res.json({ success: false, message: '哎呀，預料之外的錯誤' });
      } else {
        // verifies secret and checks exp
        jwt.verify(token, user.local.password, function(err, decoded) {
          if (err) {
            return res.json({ success: false, message: '哎呀，認證失敗' });
          } else {
            // if everything is good, save to request for use in other routes
            req.user = decoded;
            // console.log(decoded);
            next();
          }
        });
      }

    })
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: '你是誰？'
    });

  }

});


router.route('/teachers')  //get all teacher //admin api
.get(isAdmin, function(req, res) {
  Teacher.find(function(err, teachers) {
    if (err)
    res.send(err);

    res.json(teachers);
  });
});

router.route('/teachers/includeuser')  //get all teacher with user populated //admin api
.get(isAdmin, function(req, res) {
  Teacher.find({})
  .populate('user')
  .exec(function (err, teachers) {
    if (err)
    res.send(err);

    res.json(teachers);
  })
});

router.route('/teacher/:user_id') //create a teacher from exist user //admin api
.post(isAdmin, function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
    if(user){
      user.role = "teacher";
      user.save(function(err) {
        if (err)
        res.send(err);

        var teacher = new Teacher();
        teacher.name = user.name;
        teacher.user = user.id;
        teacher.userId = user.id;
        teacher.save(function(err, t) {
          if (err)
          res.send(err);

          User.findById(user.id, function(err, u) {
            u.local.teacher = t.id;
            u.save();
            res.json({ message: 'Teacher created and change user_s role to teacher!' });
          });
        });
      });
    }else{
      res.send("user not exist!");
    };
  });

})

router.route('/teacher/:user_id/:teacher_id') //DELETE single teacher using its user_id and teacher_id //admin api

.delete(isAdmin, function(req, res) {
  Teacher.remove({_id: req.params.teacher_id}, function(err) {
    if (err)
    res.send(err);

    User.findById(req.params.user_id, function(err, user) {
      if (err)
      res.send(err);

      user.role = "user";
      user.teacher = undefined;// update the bears info
      user.save(function(err) {
        if (err)
        res.send(err);

        res.json("Delete teacher and change to user role");
      });

    });
  });

});

router.route('/users')  // get all the users //admin api
.get(isAdmin, function(req, res) {
  User.find(function(err, users) {
    if (err)
    res.send(err);

    res.json(users);
  });
});

router.route('/users/:user_id')
.get(isLoggedIn, function(req, res) {  //get a user's info //user api
User.findById(req.params.user_id, function(err, user) {
  if (err)
  res.send(err);
  res.json(user);
});
})

.delete(isAdmin, function(req, res) { //delete a user //admin api
  User.findById(req.params.user_id, function(err, user) {
    switch(user.role){
      case "admin":
      res.send("Admin cannot be deleted");
      break;
      default:
      User.remove({_id: req.params.user_id}, function(err, user) {
        if (err)
        res.send(err);

        res.json({ message: 'Successfully deleted user' });
      });
    }

  });
});


router.route('/student/:student_id')  //get a student's info //user api
.get(isLoggedIn, function(req, res) {
  Student.findById(req.params.student_id, function(err, student) {
    if (err)
    res.send(err);

    res.json(student);
  });
})
.delete(isAdmin, function(req, res) { //delete a student role from a user //admin api

  Student.findById(req.params.student_id, function(err, student) {
    if (err)
    res.send(err);

    var userid = student.user;

    Student.remove({_id: req.params.student_id}, function(err) {
      if (err)
      res.send(err);

      User.findById(userid, function(err, user) {

        if (err)
        res.send(err);

        user.role = "user";
        user.schoolId = undefined;
        user.student = undefined;
        user.save(function(err) {
          if (err)
          res.send(err);

          res.json("Delete student and change to user role");
        });

      });
    });

  });
});

router.route('/students')  //get all students //admin api
.get(isAdmin, function(req, res) {
  Student.find(function(err, students) {
    if (err)
    res.send(err);

    res.json(students);
  });
});

router.route('/students/multi')  //create multiple students account //admin api //not complete
.post(isAdmin, function(req, res) {
  if(req.body){
    var idArray = req.body['data[]'];
    var arrayLength = idArray.length;
    for (var i = 0; i < arrayLength; i++) {
      console.log(idArray[i]);
      //Do something
      var newUser = new User();
      newuser.schoolId = idArray[i];
      //             user.name = '';
      newuser.role = 'student';
      newuser.password = newUser.generateHash("123456"); //默认密码123456
      newUser.save(function(err, u) {
        if (err){
          res.send(err);
        }else{
          var student = new Student();
          student.user = u.id;
          student.name = u.name;
          student.schoolId = u.local.schoolId;
          student.save(function(err, s){
            User.findById(u.id, function(err, user) {
              user.student = s.id;
              user.save();
            });
          });
        }

      });
    };

    Student.find(function(err, students) {
      if (err)
      res.send(err);

      res.json(students);
    });

  }else{
    res.json({ message: 'student create failed!' });
  }
});

router.route('/students/query/:query')  //query students with their name //user api
.get(isLoggedIn, function(req, res) {
  var query = req.params.query;
  if(query == "all"){
    Student.find(
      {}, "_id name schoolId", //以後可以包括班級，便於辨別重名學生
      function(err,students) {
        res.json(students);
      }
    );
  }else{
    Student.find(
      { "name": { "$regex": req.params.query, "$options": "i" } },
      function(err,students) {
        res.json(students);
      }
    );
  }
});

router.route('/group')
.post(isTeacher, function(req, res) {  //teacher create a student group  //teacher api

  var data = Object.keys(req.body)[0];
  var jsonData = JSON.parse(data);

  var reformattedStudents = jsonData["students"].map(function(obj){
    var rObj = {};
    rObj["id"] = obj.id;
    return rObj;
  });
  var newLog = {
    writeBy : req.user.id,
    date : Date.now(),
    event : "new group",
    text : "創建新小組﹣" + jsonData["name"]
  }


  var newGroup = new Group();
  newGroup.name = jsonData["name"];
  newGroup.notice.text = jsonData["name"]+ "﹣新小組成立啦，快過來看看吧";
  newGroup.public.boolean = jsonData["public"];
  newGroup.public.owner = req.user.teacher;
  newGroup.students = reformattedStudents;
  newGroup.logs = newLog;

  newGroup.save(function(err, group) {
    if(err){
      res.send(err);
    }else{
      Teacher.findById(req.user.teacher, function(err, t){
        t.teachGroups.push({
          group: group.id,
        });
        t.save(function(err) {
          if(err){
            res.send(err);
          }else{
            res.json("create group success");
          }

        })

      });
    }
  });

});
router.route('/studentgroups') //get student's groups //student api
.get(isStudent, function(req, res){

  var studentid = req.user.student;
  Group.find({'students.id': studentid},'_id name notice').lean().exec(function (err, groups) {
    if(err) res.send(err);

    res.json(groups);
  })

})

router.route('/teacher/groups/:option') //get teacher's groups //teacher api
.get(isTeacher, function(req, res){
  var option = req.params.option;
  var teacher_id = req.user.teacher;

  // Deprecated APIs 未来用法有待测试

  //   if(option == "simple"){
  //     Group.aggregate([{$match:{"public.owner" : teacher_id}},
  //                      {$project: {students: {$size: '$students'},
  //                                  name: '$name',
  //                                  public:{
  //                                    boolean:'$public.boolean'
  //                                  }}}],
  //                     function(err,groups) {
  //       res.json(groups);
  //     })
  //   }else if(option == "students"){
  //     Group.aggregate([{$match:{"public.owner" : teacher_id}},
  //                      {$project: {students: '$students'}}],
  //                     function(err,groups) {
  //       res.json(groups);
  //     })
  //   }else
  if(option == "fromtc"){
    Teacher.findById(req.user.teacher,
      'teachGroups').populate('teachGroups.group', 'name students public.boolean').lean()
      .exec(function (err, teachGroups) {
        if (err) res.json(err);

        var arrayToModify = teachGroups;
        for(i=0;i<arrayToModify["teachGroups"].length;i++){
          arrayToModify["teachGroups"][i].group.students = arrayToModify["teachGroups"][i].group.students.length;
        }
        res.json(arrayToModify);
      })

    }else{
      res.json("hello");
    }
  })

  router.route('/teacher/group/:group_id') //get teacher's group info //teacher api
  .get(isTeacher, function(req, res){
    var group_id = req.params.group_id;
    var poputaleQuery = [{path:"students.id", select:"name schoolId"},{path:"logs.writeBy", select:"local.name"}]
    Group.findById(group_id, "students notice logs").populate(poputaleQuery)
    .exec(function (err, group) {
      res.json(group)
    })


  })
  router.route('/teacher/delete/group/:group_id') //教師刪除小組api //teacher pi
  .delete(isTeacher, function(req, res){
    var group_id = req.params.group_id;
    var teacher_id = req.user.teacher;
    Group.remove({_id: group_id}, function(err) {
      if(err) res.send(err);

      Teacher.findById(teacher_id, function(err, teacher){
        teacher.teachGroups.pull({group: group_id});
        teacher.save(function(err){
          if(err) res.send(err);

          res.json("success delete a group")
        })
      })
    })
  })

  router.route('/teacher/update/group/:group_id/:option')  //教師更新小組信息api //teacher api
  .put(isTeacher, function(req, res){
    var group_id = req.params.group_id;
    var option = req.params.option;

    if(option == "notice"){
      var newNotice = Object.keys(req.body)[0];
      var newLog = {
        writeBy : req.user.id,
        date : Date.now(),
        event : "update notice",
        text : "發佈新小組通知：" + newNotice
      }

      Group.findById(group_id, function(err, group){
        if(newNotice){
          group.notice.text = newNotice;
          group.logs.push(newLog);
          group.save(function(err) {
            if (err)
            res.send(err);

            res.json("update notice success");
          });
        }else{
          group.notice.text = " ";
          group.save(function(err) {
            if (err)
            res.send(err);

            res.json("update notice success");
          });
        }
      })
    }else if (option == "name") {
      var newName = Object.keys(req.body)[0];

      Group.findById(group_id, function(err, group){
        if(newName){
          group.name = newName;
          group.save(function(err) {
            if (err)
            res.send(err);

            res.json("update group name success");
          });
        }else{
          res.status(500).send({ error: 'The name you entered is empty' });
        }
      })

    }else if (option == "members") {
      var newMembers = Object.keys(req.body)[0];

      console.log(newMembers)

      if(newMembers){

        Group.update({"_id":group_id}, { $set: { students: JSON.parse(newMembers) }}, function(err, g){
          if (err) {
            res.status(500).json("fail");
          }
          res.json("update group name success");
        });

      }else{
        res.status(500).send({ error: 'The members you submitted is empty' });
      }


    } else {
      res.status(500).json("fail")
    }
  })

  router.route('/user/info') //get teacher's group info //teacher api
  .get(function(req, res){

    User.findById(req.user.id, {"local.password": 0}, function(err, user){
      if(err){
        res.send(err);
      }else{
        res.json(user)
      }
    });

  });
  module.exports = router;

  // route middleware to make sure a user is logged in
  function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    // if (req.isAuthenticated())
    // return next();
    //
    // // if they aren't redirect them to the home page
    // res.json("you are not logged in");
    if (req.user){
      return next();
    }else{
      res.json("hello");
    }
  }

  function isAdmin(req, res, next) {
    //旧的session认证取消，使用新的token认证
    // if user is authenticated in the session, carry on
    // if (req.isAuthenticated())
    // if (req.user.role == "admin")
    // return next();
    // // if they aren't redirect them to the home page
    // res.json("hello");
    if (req.user.role == "admin"){
      return next();
    }else{
      res.json("hello");
    }
  }

  function isTeacher(req, res, next) {
    //旧的session认证取消，使用新的token认证
    // if user is authenticated in the session, carry on
    // if (req.isAuthenticated())
    // if (req.user.role == "teacher")
    // return next();
    // if they aren't redirect them to the home page
    if (req.user.role == "teacher"){
      return next();
    }else{
      res.json("hello");
    }
  }

  function isStudent(req, res, next) {
    //旧的session认证取消，使用新的token认证
    // if user is authenticated in the session, carry on
    // if (req.isAuthenticated())
    // if (req.user.role == "student")
    // return next();
    // // if they aren't redirect them to the home page
    // res.json("hello");
    if (req.user.role == "student"){
      return next();
    }else{
      res.json("hello");
    }
  }
