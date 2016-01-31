var express = require('express');
var router = express.Router();
var passport = require('passport');
// var passportLinkedIn = require('../auth/linkedin');
var Teacher = require('../models/teacher');
var Student = require('../models/student');
var User = require('../models/localuser');
var Group = require('../models/group')

var Thomework = require('../models/thomework');
var Shomework = require('../models/shomework');



router.route('/teachers')  //not production！！需要添加权限检查
//get all teacher
  .get(isAdmin, function(req, res) {
  Teacher.find(function(err, teachers) {
    if (err)
      res.send(err);

    res.json(teachers);
  });
});

router.route('/teachers/includeuser')  //not production！！需要添加权限检查
//get all teacher with user populated
  .get(isAdmin, function(req, res) {
  Teacher.find({})
    .populate('user')
    .exec(function (err, teachers) {
    if (err)
      res.send(err);

    res.json(teachers);
  })
});

router.route('/teacher/:user_id') //create a teacher from exist user

  .post(isAdmin, function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
    if(user){
      user.local.role = "teacher";  // update the bears info
      user.save(function(err) {
        if (err)
          res.send(err);

        var teacher = new Teacher();
        teacher.name = user.local.name;
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

    }

  });

})

router.route('/teacher/:user_id/:teacher_id') //DELETE single teacher using its user_id and teacher_id

  .delete(isAdmin, function(req, res) { //need isAdmin

  Teacher.remove({_id: req.params.teacher_id}, function(err, user) {
    if (err)
      res.send(err);

    User.findById(req.params.user_id, function(err, user) {

      if (err)
        res.send(err);

      user.local.role = "user";
      user.local.teacher = undefined;// update the bears info
      user.save(function(err) {
        if (err)
          res.send(err);

        res.json("Delete teacher and change to user role");
      });

    });
  });

});

//     .get(function(req, res) {
//         Teacher.findById(req.params.teacher_id, function(err, teacher) {
//             if (err)
//                 res.send(err);
//             res.json(teacher);
//         });
//     })

//     .delete(function(req, res) { //need isAdmin
//         Teacher.remove({
//             _id: req.params.user_id
//         }, function(err, user) {
//             if (err)
//                 res.send(err);

//             res.json({ message: 'Successfully deleted teacher role of user' });
//         });
//     });

router.route('/users')  //not production！！需要添加权限检查

// get all the users
  .get(isAdmin, function(req, res) {
  User.find(function(err, users) {
    if (err)
      res.send(err);

    res.json(users);
  });
});

router.route('/users/:user_id') //single user query
  .get(isLoggedIn, function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  });
})

  .delete(isAdmin, function(req, res) { //need isAdmin   //delete a user
  User.findById(req.params.user_id, function(err, user) {
    switch(user.local.role){
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


router.route('/student/:student_id')  //not production！！需要添加权限检查
  .get(isLoggedIn, function(req, res) {
  Student.findById(req.params.student_id, function(err, student) {
    if (err)
      res.send(err);
    res.json(student);
  });
})
  .delete(isAdmin, function(req, res) { //need isAdmin

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

        user.local.role = "user";
        user.local.schoolId = undefined;
        user.local.student = undefined;
        user.save(function(err) {
          if (err)
            res.send(err);

          res.json("Delete student and change to user role");
        });

      });
    });


  });



});

router.route('/students')  //not production！！需要添加权限检查
//get all students
  .get(isAdmin, function(req, res) {
  Student.find(function(err, students) {
    if (err)
      res.send(err);

    res.json(students);
  });
});


router.route('/students/multi')  //not production！！需要添加权限检查
// create a bear (accessed at POST http://localhost:8080/api/bears)
  .post(isAdmin, function(req, res) {
  if(req.body){
    var idArray = req.body['data[]'];
    var arrayLength = idArray.length;
    for (var i = 0; i < arrayLength; i++) {
      console.log(idArray[i]);
      //Do something
      var newUser = new User();
      newUser.local.schoolId = idArray[i];
      //             user.local.name = '';
      newUser.local.role = 'student';
      newUser.local.password = newUser.generateHash("123456");
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
              user.local.student = s.id;
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

router.route('/students/query/:query')  //not production！！需要添加权限检查
  .get(isLoggedIn, function(req, res) {
  Student.find(
    { "name": { "$regex": req.params.query, "$options": "i" } },
    function(err,students) {
      res.json(students);
    }
  );
});

router.route('/group')
  .post(isTeacher, function(req, res) {  //teacher create a student group

  var data = Object.keys(req.body)[0];
  var jsonData = JSON.parse(data);

  var newGroup = new Group();
  newGroup.name = jsonData["name"];
  newGroup.public.boolean = jsonData["public"];
  newGroup.public.owner = req.user.local.teacher;
  newGroup.students = jsonData["students"]
  newGroup.save(function(err, g) {
    if (err)
      res.send(err);

    Teacher.findById(req.user.local.teacher, function(err, t){
      t.teachGroups.push({
        group: g.id,
      });
      t.save();
      res.json("create group success");
    });
  });

});

router.route('/teacher/groups/:option') //get teacher's groups
  .get(isTeacher, function(req, res){
  var option = req.params.option;
  var teacher_id = req.user.local.teacher;

  if(option == "simple"){
    Group.aggregate([{$match:{"public.owner" : teacher_id}},
                     {$project: {students: {$size: '$students'},
                                 name: '$name',
                                 public:{
                                   boolean:'$public.boolean'
                                 }}}],
                    function(err,groups) {
      res.json(groups);
    })
  }else if(option == "students"){
    Group.aggregate([{$match:{"public.owner" : teacher_id}},
                     {$project: {students: '$students'}}],
                    function(err,groups) {
      res.json(groups);
    })
  }else if(option == "fromtc"){
    Teacher.findById(req.user.local.teacher,
                     {__v:0,
                      _id:0,
                      name:0,
                      user:0,
                      thomeworks:0}).populate('teachGroups.group', 'name students public.boolean').lean() // only return the Persons name
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

router.route('/teacher/group/:group_id')
  .get(isTeacher, function(req, res){
  var group_id = req.params.group_id;

  Group.findById(group_id,
                 { name: 0 },
                 function(err,group) {
    res.json(group);
  })


})

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
  res.json("hello");
}

function isTeacher(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    if (req.user.local.role == "teacher")
      return next();
  // if they aren't redirect them to the home page
  res.json("hello");
}
