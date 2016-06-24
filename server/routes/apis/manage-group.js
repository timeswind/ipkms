var _ = require('lodash');
var express = require('express');
var router = express.Router();

var Group = require('../../models/group');

router.route('/teacher/groups')
    .get(isTeacher, function (req, res) {
        var teacher_id = req.user.teacher;
        Group.find({'owner': teacher_id}, 'name students public').lean().exec(function (err, groups) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                for (i = 0; i < groups.length; i++) {
                    groups[i].students = groups[i].students.length
                }
                res.json(groups)
            }
        })
    })
    .post(isTeacher, function (req, res) {  //teacher create a student group  //teacher api
        /**
         * @param {string} req.body.name - Group Name
         */
        /**
         * @param {string} req.body.public - PRIVATE OR PUBLIC GROUP
         */
        /**
         * @param {array} req.body.students - Array of student ids
         */
        var data = req.body;
        var requiredParams = ['name', 'public', 'students'];
        if (_.every(requiredParams, _.partial(_.has, data)) && _.isArray(data.students)) {

            var newGroup = new Group();
            newGroup.name = data.name;
            newGroup.owner = req.user.teacher;
            newGroup.public = data.public;
            newGroup.students = data.students;

            newGroup.save(function (err) {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.send('success');
                }
            });
        } else {
            res.status(400)
        }

    });

router.route('/teacher/group/:group_id')
    .get(isTeacher, function (req, res) {
        /**
         * @param {string} req.params.group_id - Group ID
         */

        if (_.has(req.params, 'group_id')) {
            var group_id = req.params.group_id;
            Group.findById(group_id, 'name notice students public').populate('students', 'name').lean().exec(function (err, group) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    res.json(group)
                }
            })
        } else {
            res.status(400).send('params missing')
        }


    })
    .delete(isTeacher, function (req, res) {

        /**
         * @param {string} req.params.group_id - Group ID
         */

        if (_.has(req.params, 'group_id')) {
            var group_id = req.params.group_id;
            Group.findById(group_id, function (err, group) {
                if (err) {
                    res.status(500).send(err.message)
                } else {
                    if (_.get(group, 'owner', false) == req.user.teacher) {
                        group.remove(function (err) {
                            if (err) {
                                res.status(500).send(err.message)
                            } else {
                                res.send('Delete group success !')
                            }
                        });
                    } else {
                        res.status(400).send('permission denied!')
                    }
                }
            })
        } else {
            res.status(400).send('params missing')
        }

    });

router.route('/update/teacher/:group_id/:option')
    .put(isTeacher, function (req, res) {
        var group_id = req.params.group_id;
        var option = req.params.option;
        var data = req.body

        if (_.isObject(data)) {
            if (option === "notice") {
                if (_.has(data, 'text')) {
                    var newNotice = data.text

                    Group.findById(group_id, function (err, group) {
                        if (newNotice.trim() !== '') {
                            group.notice.text = newNotice;
                            group.save(function (err) {
                                if (err) {
                                    res.send(err.message)
                                } else {
                                    res.send("success");
                                }
                            });
                        } else {
                            group.notice.text = " ";
                            group.save(function (err) {
                                if (err) {
                                    res.send(err.message)
                                } else {
                                    res.send("success");
                                }
                            });
                        }
                    })
                } else {
                    res.status(500).send('expect param to be a String')
                }
            } else if (option === "name") {
                if (_.has(data, 'name')) {
                    var newName = data.name
                    Group.findById(group_id, function (err, group) {
                        if (newName) {
                            group.name = newName;
                            group.save(function (err) {
                                if (err) {
                                    res.send(err.message)
                                } else {
                                    res.send("success");
                                }
                            });
                        } else {
                            res.status(500).send('The name you entered is empty');
                        }
                    })
                }
            } else if (option == "members") {
                var updatedMembers = _.uniq(data)
                Group.update({"_id": group_id}, {$set: {students: updatedMembers}}, function (err, g) {
                    if (err) {
                        res.status(500).json(err.message);
                    } else {
                        res.json("update group name success");
                    }
                });
            } else {
                res.status(500).send('option wrong')
            }
        } else {
            res.status(500).send('params wrong')
        }
    });

router.route('/public/groups')
    .get(isTeacher, function (req, res) {
        Group.find({'public': true}, 'name students public').lean().exec(function (err, groups) {
            if (err) {
                res.status(500).send(err.message)
            } else {
                for (i = 0; i < groups.length; i++) {
                    groups[i].students = groups[i].students.length
                }
                res.json(groups)
            }
        })
    });

module.exports = router;

function isTeacher(req, res, next) {

    if (req.user.role == "teacher") {
        return next();
    } else {
        res.status(401);
    }
}