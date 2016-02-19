angular.module('ipkms')

.controller('homeController', function($rootScope, $scope, $http) {

  console.log("hello home!")

})
.controller('homeworksManageController', function($rootScope, $scope, $http, $mdDialog, $mdMedia, apiService, homeworkService, generalService) {
  getMyThomeworks();
  var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
  $scope.showNewHomeworkForm = function(ev) {
    $mdDialog.show({
      templateUrl: '/html/newhomeworkform.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:false,
      fullscreen: useFullScreen,
      controllerAs: 'ctrl',
      controller: "NewHWDialogController"
    }).then(function(results) {
      if(results == "success"){
        getMyThomeworks();
      }
    }, function() {
      console.log('You cancelled the dialog.');
    });

  };
  $scope.showThomeworkDialog = function(ev, t) {
    $scope.thomework = t;
    $mdDialog.show({
      templateUrl: '/html/thomework-modal.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      locals: {
        thomework: $scope.thomework
      },
      controller: "ThomeworkModalController"
    }).then(function(results) {
      if(results == "success"){
        getMyThomeworks();
      }
    }, function() {
      console.log('You cancelled the dialog.');
    });

  };

  $scope.bTd = function(boolean){
    return homeworkService.deliveryBooleanToText(boolean)
  }

  $scope.idToDate = function(id){
    return generalService.idToDate(id)
  }

  var doneGrabingGroupsDataTimer;

  function getMyThomeworks(){
    $scope.grabingGroupsData = true;
    clearTimeout(doneGrabingGroupsDataTimer);
    apiService.get("/api/teacher/homeworks/fromtc").then(
      function( response ) {
        $scope.MyThomeworks = response.data.thomeworks.slice().reverse();
        doneGrabingGroupsDataTimer = setTimeout(doneGrabingGroupsData, 1500);
      },
      function(response) { // optional
        console.log("fail to get thomework" + response)
      })
  }

  function doneGrabingGroupsData(){
    $scope.grabingGroupsData = false;
    $scope.$apply();
  }

  $scope.arrayToString = function(array){
    return generalService.tagsArrayToString(array)
  }

  $scope.predicate = 'none';
  $scope.reverse = false;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };

  $scope.deleteThomework = function(id){
    console.log(id)
    var apiURL = '/api/delete/teacher/thomework/' + id
    apiService.delete(apiURL).then(function(response) {
      getMyThomeworks();
    },
    function(response) { // optional
      console.log("fail to delete this thomework")
    });
  }


})

.controller('groupsManageController', function($rootScope, $scope, $http, $mdDialog, $mdMedia) {
  getMyGroups();
  $scope.myGroups = [];
  $scope.bTt = function(b){
    if(b === true){
      return "公開小組";
    }else{
      return "私人小組";
    }
  }
  var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
  $scope.showNewGroupForm = function(ev) {

    $mdDialog.show({
      templateUrl: '/html/newgroupform.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:false,
      fullscreen: useFullScreen,
      controllerAs: 'ctrl',
      controller: "NewGDialogController"
    })        .then(function(refreshMyGroups) {
      if(refreshMyGroups == "success"){
        getMyGroups();
      }
    }, function() {
      console.log('You cancelled the dialog.');
    });
  };

  $scope.showGroupDialog = function(ev, g) {
    $scope.group = g;
    $mdDialog.show({
      templateUrl: '/html/groupmodal.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      locals: {
        group: $scope.group
      },
      controller: "GroupModalController"
    });

  };

  var originatorEv;
  $scope.openMenu = function($mdOpenMenu, ev) {
    originatorEv = ev;
    $mdOpenMenu(ev);
  };
  $scope.deleteGroup = function(group_id) {

    $mdDialog.show(
      $mdDialog.confirm()
      .title('你確定要刪除這個小組嗎？')
      .textContent('這個操作不可以撤銷')
      .ok('我確定')
      .cancel('取消')
      .targetEvent(originatorEv)
    ).then(function() {
      deleteGroup(group_id);
    });
    originatorEv = null;

  };

  //抓取小组数据开始
  var doneGrabingGroupsDataTimer;

  function getMyGroups(){
    $scope.grabingGroupsData = true;
    clearTimeout(doneGrabingGroupsDataTimer);
    $http({
      url: '/api/teacher/groups/fromtc',
      method: "GET",
    })
    .then(function(response) {
      $scope.myGroups = response.data.teachGroups;
      doneGrabingGroupsDataTimer = setTimeout(doneGrabingGroupsData, 1500);

    },
    function(response) { // optional
      console.log(response)
    });
  }

  function doneGrabingGroupsData(){
    $scope.grabingGroupsData = false;
    $scope.$apply();
  }
  //抓取小组数据结束

  function deleteGroup(group_id){
    $http({
      url: '/api/teacher/delete/group/' + group_id,
      method: "DELETE",
    })
    .then(function(response) {
      getMyGroups();
    },
    function(response) { // optional
      console.log("fail to delete this group")
    });
  }

})

.controller('NewHWDialogController', function($rootScope, $scope, $http, $mdDialog, $mdMedia, apiService, subjectsService) {
  $scope.subjects = subjectsService.subjects

  $scope.groupsClasses = null;
  $scope.newhomework = {
    delivery : "false",
    tags : []
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.loadMyGroups = function() {

    apiService.get("/api/teacher/groups/simple").then(
      function( response ) {
        var reformatedResponse = response.data.teachGroups.map(function(obj){
          var robj = {};
          robj["category"] = 'group';
          robj["name"] = obj.group.name;
          robj["id"] = obj.group._id;

          return robj;
        })
        return $scope.groupsClasses = reformatedResponse
      },
      function(response) { // optional
        console.log("fail to get mygroups" + response)
      })
  }

  $scope.createHomework = function(){
    var homeworkData = {
      delivery : $scope.newhomework.delivery,
      title : $scope.newhomework.title,
      requirement : $scope.newhomework.requirement,
      subject : $scope.newhomework.subject,
      tags : $scope.newhomework.tags,
      targetGroup : $scope.newhomework.targetGroup,
      deadline : $scope.newhomework.deadline
    }
    console.log(homeworkData);
    apiService.post("/api/teacher/manage/homework", homeworkData).then(function(response) {
      // success
      $mdDialog.hide("success");
    },
    function(response) {
      // failed
      console.log("create Homework fail")

    });
  }

})

.controller('NewGDialogController', function($scope, $http, $mdDialog, $mdMedia, $timeout, $interval) {
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
      boolean : "true"
    }
  };

  $scope.searchDone = true;

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.clickStudentTile = function(stu){

    if(!containsObject(stu, self.selectedStudents)){
      self.selectedStudents.push(stu);
    }

  };


  //on keyup, start the countdown
  $scope.keyup = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  }
  //on keydown, clear the countdown
  $scope.keydown = function(){
    if (event.keyCode == 8) {
      $scope.searchDone = true;
    }else{
      $scope.searchDone = false;
    }
    clearTimeout(typingTimer);
  }

  //user is "finished typing," do student query
  function doneTyping () {
    if((self.searchText !== '') && !(arrayContains(self.searchText, searchedText))){
      queryStudents(self.searchText);
    }
  }
  //student query function
  function queryStudents(query){
    $http({
      method: 'GET',
      url: '/api/students/query/' + query
    }).then(function successCallback(response) {
      for (var i = 0; i < response.data.length; i++) {
        var chipObject =
        {
          "schoolid": response.data[i]["schoolId"],
          "name": response.data[i]["name"],
          "id": response.data[i]["_id"]
        };

        if(!containsObject(chipObject, cs)){
          cs.unshift(chipObject);
        }

        if(!arrayContains(response.data[i]["name"], searchedText)){
          searchedText.push(response.data[i]["name"]);
        }

        if(!arrayContains(response.data[i]["schoolid"], searchedText)){
          searchedText.push(response.data[i]["schoolId"]);
        }
      }

      if(response.data.length !== 0){
        if(!arrayContains(query, searchedText)){
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
    if(cs.length !== 0){
      var results = query ? self.students.filter(createFilterFor(query)) : [];
      return results;
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
    var veggies = cs;
    return veggies;
  }

  $scope.createGroup = function(){
    var data = {
      "name" : $scope.newgroup.name,
      "public" : $scope.newgroup.public.boolean,
      "students" : self.selectedStudents
    };

    console.log(data);
    $http({
      url: '/api/group',
      method: "POST",
      data: data,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}

    })
    .then(function(response) {
      // success
      $mdDialog.hide("success");
    },
    function(response) { // optional
      // failed
    });
  }

  function containsObject(obj, list) {
    for (i = 0; i < list.length; i++) {
      if (list[i]["schoolid"] == obj["schoolid"]) {
        return true;
      }
    }
    return false;
  }

  function arrayContains(needle, arrhaystack){return (arrhaystack.indexOf(needle) > -1);}
})

.controller('ThomeworkModalController', function($scope, $http, $sce, $mdDialog, $mdMedia, thomework, apiService, subjectsService, homeworkService) {
  getThomeworkDetails();
  thomework.subjectText = subjectsService.idToName(thomework.subject)
  thomework.deliveryText = homeworkService.deliveryBooleanToText(thomework.delivery)
  $scope.thomework = thomework
  $scope.hide = function() {
    $mdDialog.hide()
  };

  $scope.cancel = function() {
    $mdDialog.cancel()
  };

  function getThomeworkDetails(){
    var apiURL = '/api/teacher/homework/' + thomework._id
    apiService.get(apiURL).then(function(response) {
      $scope.thomeworkDetails = response.data
      $scope.requirementHtml = $sce.trustAsHtml(response.data.requirement)
      $scope.editableRequirement = response.data.requirement
    },
    function(response) { // optional
      console.log("fail to get homework's details")
    });

  }

  $scope.loadMyGroups = function() {

    apiService.get("/api/teacher/groups/simple").then(
      function( response ) {
        var reformatedResponse = response.data.teachGroups.map(function(obj){
          var robj = {};
          robj["category"] = 'group';
          robj["name"] = obj.group.name;
          robj["id"] = obj.group._id;

          return robj;
        })
        return $scope.groupsClasses = reformatedResponse
      },
      function(response) { // optional
        console.log("fail to get mygroups" + response)
      })
  }

  $scope.publishSavedHomework = function(){
    var publishHomeworkData = {
      targetGroup : $scope.publishhomework.targetGroup,
      deadline : $scope.publishhomework.deadline
    }

    var apiURL = "/api/update/teacher/thomework/" + thomework._id + "/publish"
    apiService.put(apiURL, publishHomeworkData).then(
      function( response ) {
        $mdDialog.hide("success")
      },
      function(response) { // optional
        console.log("fail to publish thomework" + response)
      })

    console.log(publishHomeworkData);
  }

  $scope.updateRequirement = function(){
    var apiURL = "/api/update/teacher/thomework/" + thomework._id + "/requirement"
    apiService.put(apiURL, $scope.editableRequirement).then(
      function( response ) {
        getThomeworkDetails();
        $scope.editRequirement = false;
      },
      function(response) { // optional
        console.log("fail to update thomework requirement" + response)
      })
  }

  $scope.updateTags = function(){
    var apiURL = "/api/update/teacher/thomework/" + thomework._id + "/tags"
    apiService.put(apiURL, $scope.thomework.tags).then(
      function( response ) {
        getThomeworkDetails();
        $scope.editTags = false;
      },
      function(response) {
        console.log("fail to update thomework tags")
      })
  }

})
.controller('GroupModalController', function($scope, $http, $mdDialog, $mdMedia, group, subjectsService) {
  getGroupDetails();
  $scope.group = group;

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.idToName = function(id){
    return subjectsService.idToName(id)
  }

  $scope.removeMember = function(index){
    $scope.gDetails.students.splice(index,1);
  }

  $scope.updateMembers = function(){
    var updatedMembersArray = $scope.gDetails.students;
    var reformattedMembersArray = updatedMembersArray.map(function(obj){
      var rObj = {};
      rObj["id"] = obj.id._id;
      return rObj;
    });

    console.log(reformattedMembersArray)

    if(reformattedMembersArray){
      $http({
        url: '/api/teacher/update/group/' + $scope.gDetails._id + '/members',
        method: "PUT",
        data: reformattedMembersArray,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      })
      .then(function(response) {
        // success
        console.log("success")
        getGroupDetails()
        $scope.editMembers = false;
        $scope.addMemberPenel = false;
        $scope.group.students = $scope.gDetails.students.length;
      },
      function(response) { // optional
        // failed
        getGroupDetails()
        $scope.addMemberPenel = false;
        $scope.editMembers = false;
      });
    }else{
      console.log("updated student field is empty~!")
    }
  }

  $scope.updateName = function(updatedName){

    if(updatedName){
      if($scope.gDetails.name !== updatedName){
        $http({
          url: '/api/teacher/update/group/' + $scope.gDetails._id + '/name',
          method: "PUT",
          data: updatedName,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}

        })
        .then(function(response) {
          // success
          $scope.group.name = updatedName;
          $scope.editName = false;
        },
        function(response) { // optional
          // failed

        });
      }else{
        $scope.editName = false;
      }
    }else{
      console.log("updated name field is empty~!")
    }
  };

  $scope.updateNotice = function(updatedNotice){

    var text = $scope.gDetails.notice;

    if(text !== undefined){
      if($scope.gDetails.notice.text !== updatedNotice){
        $http({
          url: '/api/teacher/update/group/' + $scope.gDetails._id + '/notice',
          method: "PUT",
          data: updatedNotice,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}

        })
        .then(function(response) {
          // success
          $scope.gDetails.notice.text = updatedNotice;
          $scope.editNotice = false;
        },
        function(response) { // optional
          // failed
        });
      }else{
        $scope.editNotice = false;
      }
    }else{
      if(updatedNotice){
        $http({
          url: '/api/teacher/update/group/' + $scope.gDetails._id + '/notice',
          method: "POST",
          data: updatedNotice,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}

        })
        .then(function(response) {
          // success
          getGroupDetails();
          $scope.editNotice = false;
        },
        function(response) { // optional
          // failed
        });
      }
    }
  };

  function getGroupDetails(){
    $http({
      url: '/api/teacher/group/' + group._id,
      method: "GET",
    })
    .then(function(response) {
      console.log(response);
      $scope.gDetails = response.data;
      $scope.originalData = response.data;
      //       console.log("get group's details success");
    },
    function(response) { // optional
      console.log("fail to get group's details")
    });
  };

  $scope.searchDone = true;
  $scope.queryedStudents = [];
  var searchedText = [];
  var typingTimer;                //timer identifier
  var doneTypingInterval = 1000;

  //on keyup, start the countdown
  $scope.keyup = function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  }
  //on keydown, clear the countdown
  $scope.keydown = function(){
    if (event.keyCode == 8) {
      $scope.searchDone = true;
    }else{
      $scope.searchDone = false;
    }
    clearTimeout(typingTimer);
  }

  //user is "finished typing," do student query
  function doneTyping () {
    if(($scope.searchText !== '') && !(arrayContains($scope.searchText, searchedText))){
      queryStudents($scope.searchText);
    }
  }
  //student query function
  function queryStudents(query){
    $http({
      method: 'GET',
      url: '/api/students/query/' + query
    }).then(function successCallback(response) {
      for (var i = 0; i < response.data.length; i++) {
        var studentObject ={
          "id":{
            "schoolId": response.data[i]["schoolId"],
            "name": response.data[i]["name"],
            "_id": response.data[i]["_id"]
          },
          "select" : false
        };

        if(!containsObject(studentObject, $scope.gDetails.students)){
          if(!containsObject(studentObject, $scope.queryedStudents)){
            $scope.queryedStudents.unshift(studentObject);
          }
        }

        if(!arrayContains(response.data[i]["name"], searchedText)){
          searchedText.push(response.data[i]["name"]);
        }

        if(!arrayContains(response.data[i]["schoolId"], searchedText)){
          searchedText.push(response.data[i]["schoolId"]);
        }
      }

      if(response.data.length !== 0){
        if(!arrayContains(query, searchedText)){
          searchedText.push(query);
        }
      }
      $scope.searchDone = true;
    }, function errorCallback(response) {
      console.log(response);
    })

  }

  $scope.clickStudentTile = function(stu,index){

    console.log($scope.gDetails.students)

    if(!containsObject(stu, $scope.gDetails.students)){
      $scope.gDetails.students.push(stu);
      $scope.queryedStudents[index]["select"] = true;

    }
  };

  function containsObject(obj, list) {
    for (i = 0; i < list.length; i++) {
      if (list[i]["id"]["schoolId"] == obj["id"]["schoolId"]) {
        return true;
      }
    }
    return false;
  }

  function arrayContains(needle, arrhaystack){return (arrhaystack.indexOf(needle) > -1);}

})
