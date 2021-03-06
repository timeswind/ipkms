angular.module('ipkms.teacherManageGroups', ['ipkmsMain', 'ipkmsService'])

.controller('GroupsManageController', function ($rootScope, $scope, $http, $mdDialog, $mdMedia, apiService, generalService) {
  getMyGroups();
  $scope.myGroups = [];
  $scope.bTt = function (b) {
    if (b === true) {
      return "公開";
    } else {
      return "私人";
    }
  };
  var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
  $scope.showNewGroupForm = function (ev) {

    $mdDialog.show({
      templateUrl: '/html/newgroupform.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: false,
      fullscreen: useFullScreen,
      controllerAs: 'ctrl',
      controller: "NewGDialogController"
    }).then(function (refreshMyGroups) {
      if (refreshMyGroups == "success") {
        getMyGroups();
      }
    }, function () {
      // console.log('You cancelled the dialog.');
    });
  };

  $scope.showGroupDialog = function (ev, group) {
    $scope.group = group;
    $mdDialog.show({
      templateUrl: '/html/groupmodal.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen,
      locals: {
        group: $scope.group
      },
      controller: "GroupModalController"
    });

  };

  var originatorEv;
  $scope.openMenu = function ($mdOpenMenu, ev) {
    originatorEv = ev;
    $mdOpenMenu(ev);
  };
  $scope.deleteGroup = function (group_id) {

    $mdDialog.show(
      $mdDialog.confirm()
      .title('你確定要刪除這個小組嗎？')
      .textContent('這個操作不可以撤銷')
      .ok('我確定')
      .cancel('取消')
      .targetEvent(originatorEv)
    ).then(function () {
      var apiURL = '/api/manage-group/teacher/group/' + group_id

      apiService.delete(apiURL).then(function (response) {
        getMyGroups();
      })

    });
    originatorEv = null;

  };

  //抓取小组数据开始
  var doneGrabingGroupsDataTimer;

  function getMyGroups() {
    $scope.grabingGroupsData = false;
    clearTimeout(doneGrabingGroupsDataTimer);
    apiService.get('/api/manage-group/teacher/groups').then(function (response) {
      $scope.myGroups = response.data;
      doneGrabingGroupsDataTimer = setTimeout(doneGrabingGroupsData, 1500);

    },
    function (response) { // optional
      console.log(response)
    });
  }

  $scope.getPublicGroups = function () {
    if (!$scope.publicGroups) {
      $scope.grabingGroupsData = false;
      clearTimeout(doneGrabingGroupsDataTimer);
      apiService.get('/api/manage-group/public/groups').then(function (response) {
        $scope.publicGroups = response.data;
        doneGrabingGroupsDataTimer = setTimeout(doneGrabingGroupsData, 1500);
      });
    }
  }

  function doneGrabingGroupsData() {
    $scope.grabingGroupsData = true;
    $scope.$apply();
  }

})

.controller('NewGDialogController', function ($scope, $http, $mdDialog, apiService) {
  var self = this;

  self.readonly = false;
  self.selectedItem = null;
  self.searchText = null;
  self.querySearch = querySearch;
  self.selectedStudents = [];
  self.numberChips = [];
  self.numberChips2 = [];
  self.numberBuffer = '';
  self.autocompleteDemoRequireMatch = true;
  self.transformChip = transformChip;

  var cs = [];
  var searchedText = [];
  var typingTimer;                //timer identifier
  var doneTypingInterval = 1000;

  $scope.newgroup = {
    public: {
      boolean: "true"
    }
  };

  $scope.searchDone = true;

  $scope.hide = function () {
    $mdDialog.hide();
  };

  $scope.cancel = function () {
    $mdDialog.cancel();
  };

  $scope.clickStudentTile = function (stu) {

    if (!containsObject(stu, self.selectedStudents)) {
      self.selectedStudents.push(stu);
    }

  };


  //on keyup, start the countdown
  $scope.keyup = function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  };
  //on keydown, clear the countdown
  $scope.keydown = function () {
    $scope.searchDone = event.keyCode == 8;
    clearTimeout(typingTimer);
  };

  //user is "finished typing," do student query
  function doneTyping() {
    if ((self.searchText !== '') && !(arrayContains(self.searchText, searchedText))) {
      queryStudents(self.searchText);
    }
  }

  //student query function
  function queryStudents(query) {
    var apiURL = '/api/students/query/' + query;

    apiService.get(apiURL).then(function successCallback(response) {
      for (var i = 0; i < response.data.length; i++) {
        var chipObject =
        {
          "schoolid": response.data[i]["schoolId"],
          "name": response.data[i]["name"],
          "id": response.data[i]["_id"]
        };

        if (!containsObject(chipObject, cs)) {
          cs.unshift(chipObject);
        }

        if (!arrayContains(response.data[i]["name"], searchedText)) {
          searchedText.push(response.data[i]["name"]);
        }

        if (!arrayContains(response.data[i]["schoolid"], searchedText)) {
          searchedText.push(response.data[i]["schoolId"]);
        }
      }

      if (response.data.length !== 0) {
        if (!arrayContains(query, searchedText)) {
          searchedText.push(query);
        }
      }
      $scope.searchDone = true;
      self.students = loadStudents();
    }, function errorCallback(response) {
      console.log(response);
    })

  }

  /**
  * Return the proper object when the append is called.
  */
  function transformChip(chip) {
    // If it is an object, it's already a known chip
    if (angular.isObject(chip)) {
      return chip;
    }
    // Otherwise, create a new one
    return {
      name: chip,
      type: 'new'
    }
  }

  /**
  * Search for students.
  */
  function querySearch(query) {
    if (cs.length !== 0) {
      var results = query ? self.students.filter(createFilterFor(query)) : [];
      return results;
    } else {
      return ''
    }
  }

  /**
  * Create filter function for a query string
  */
  function createFilterFor(query) {

    //     var lowercaseQuery = angular.lowercase(query); //for english only
    return function filterFn(student) {
      return (student.name.indexOf(query) != -1) ||
      (student.schoolid.indexOf(query) != -1);
    };

  }

  function loadStudents() {
    var students = cs;
    return students;
  }

  $scope.createGroup = function () {

    if ($scope.newgroup.name) {

      var students = self.selectedStudents.map(function (obj) {
        var rObj = obj.id;
        return rObj;
      });

      var data = {
        "name": $scope.newgroup.name,
        "public": $scope.newgroup.public.boolean,
        "students": students
      };

      console.log(data)

      apiService.postJSON('/api/manage-group/teacher/groups', data).then(function (response) {
        // success
        if (response.data === 'success') {
          $mdDialog.hide("success");
        }
      });
    }

  }

  function containsObject(obj, list) {
    for (i = 0; i < list.length; i++) {
      if (list[i]["schoolid"] == obj["schoolid"]) {
        return true;
      }
    }
    return false;
  }

  function arrayContains(needle, arrhaystack) {
    return (arrhaystack.indexOf(needle) > -1);
  }
})

.controller('GroupModalController', function ($scope, $http, $mdDialog, $mdMedia, group, subjectsService, apiService) {
  getGroupDetails();
  $scope.group = group;

  $scope.hide = function () {
    $mdDialog.hide();
  };

  $scope.cancel = function () {
    $mdDialog.cancel();
  };

  $scope.idToName = function (id) {
    return subjectsService.idToName(id)
  }

  $scope.removeMember = function (index) {
    $scope.gDetails.students.splice(index, 1);
  }

  $scope.updateMembers = function () {
    var updatedMembersArray = $scope.gDetails.students;
    var data = updatedMembersArray.map(function (obj) {
      return obj._id;
    });

    if (data) {
      var apiURL = '/api/manage-group/update/teacher/' + $scope.gDetails._id + '/members'
      apiService.put(apiURL, data).then(function (response) {
        getGroupDetails()
        $scope.editMembers = false;
        $scope.addMemberPenel = false;
        $scope.group.students = $scope.gDetails.students.length;
      },
      function (response) { // optional
        getGroupDetails()
        $scope.addMemberPenel = false;
        $scope.editMembers = false;
      });
    } else {
      console.log("updated student field is empty~!")
    }
  };

  $scope.updateName = function (updatedName) {
    if (updatedName) {
      var data = {
        name: updatedName
      }
      if ($scope.gDetails.name !== updatedName) {
        var apiURL = '/api/manage-group/update/teacher/' + $scope.gDetails._id + '/name'
        apiService.put(apiURL, data).then(function (response) {
          // success
          $scope.group.name = updatedName;
          $scope.editName = false;
        })
      } else {
        $scope.editName = false;
      }
    } else {
      console.log("updated name field is empty~!")
    }
  };

  $scope.updateNotice = function (updatedNotice) {

    var data = {
      text: updatedNotice
    }
    var text = $scope.gDetails.notice;
    if (text !== undefined) {
      if ($scope.gDetails.notice.text !== updatedNotice) {
        var apiURL = '/api/manage-group/update/teacher/' + $scope.gDetails._id + '/notice'
        apiService.put(apiURL, data).then(function (response) {
          // success
          $scope.gDetails.notice.text = updatedNotice;
          $scope.editNotice = false;
        });
      } else {
        $scope.editNotice = false;
      }
    } else {
      if (updatedNotice) {
        var apiURL = '/api/manage-group/update/teacher/' + $scope.gDetails._id + '/notice'
        apiService.put(apiURL, data).then(function (response) {
          // success
          getGroupDetails();
          $scope.editNotice = false;
        });
      }
    }
  };

  function getGroupDetails() {
    var apiURL = '/api/manage-group/teacher/group/' + group._id
    apiService.get(apiURL).then(function (response) {
      console.log(response.data);
      $scope.gDetails = response.data;
      $scope.originalData = response.data;
    },
    function (response) { // optional
      console.log("fail to get group's details")
    });
  };

  $scope.searchDone = true;
  $scope.queryedStudents = [];
  var searchedText = [];
  var typingTimer;                //timer identifier
  var doneTypingInterval = 1000;

  //on keyup, start the countdown
  $scope.keyup = function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  }
  //on keydown, clear the countdown
  $scope.keydown = function () {
    if (event.keyCode == 8) {
      $scope.searchDone = true;
    } else {
      $scope.searchDone = false;
    }
    clearTimeout(typingTimer);
  }

  //user is "finished typing," do student query
  function doneTyping() {
    if (($scope.searchText !== '') && !(arrayContains($scope.searchText, searchedText))) {
      queryStudents($scope.searchText);
    }
  }

  //student query function
  function queryStudents(query) {
    $http({
      method: 'GET',
      url: '/api/students/query/' + query
    }).then(function successCallback(response) {
      for (var i = 0; i < response.data.length; i++) {
        var studentObject = {
          "_id": response.data[i]["_id"],
          "schoolId": response.data[i]["schoolId"],
          "name": response.data[i]["name"],
          "select": false
        };

        if (!containsObject(studentObject, $scope.gDetails.students)) {
          if (!containsObject(studentObject, $scope.queryedStudents)) {
            $scope.queryedStudents.unshift(studentObject);
          }
        }

        if (!arrayContains(response.data[i]["name"], searchedText)) {
          searchedText.push(response.data[i]["name"]);
        }

        if (!arrayContains(response.data[i]["schoolId"], searchedText)) {
          searchedText.push(response.data[i]["schoolId"]);
        }
      }

      if (response.data.length !== 0) {
        if (!arrayContains(query, searchedText)) {
          searchedText.push(query);
        }
      }
      $scope.searchDone = true;
    }, function errorCallback(response) {
      console.log(response);
    })

  }

  $scope.clickStudentTile = function (stu, index) {
    if (!containsObject(stu, $scope.gDetails.students)) {
      $scope.gDetails.students.push(stu);
      $scope.queryedStudents[index]["select"] = true;
    }
  };

  function containsObject(obj, list) {
    for (i = 0; i < list.length; i++) {
      if (list[i]["schoolId"] == obj["schoolId"]) {
        return true;
      }
    }
    return false;
  }

  function arrayContains(needle, arrhaystack) {
    return (arrhaystack.indexOf(needle) > -1);
  }

});
