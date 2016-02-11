angular.module('home', ['ngMaterial','ngMessages'])
.config(function($interpolateProvider, $httpProvider, $mdThemingProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
  $httpProvider.interceptors.push('authInterceptor');

  //Reset headers to avoid OPTIONS request (aka preflight)
  // $httpProvider.defaults.headers.common = {};
  // $httpProvider.defaults.headers.post = {};
  // $httpProvider.defaults.headers.put = {};
  // $httpProvider.defaults.headers.patch = {};

  $mdThemingProvider.theme('docs-dark', 'default')
  .primaryPalette('yellow')
  .dark();
})

.controller('homeController', function($rootScope, $scope, $http) {

  console.log("hello home!")

})
.controller('homeworkManageController', function($rootScope, $scope, $http, $mdDialog, $mdMedia) {

  $scope.showNewHomeworkForm = function(ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
    $mdDialog.show({
      controller: NewHWDialogController,
      templateUrl: '/html/newhomeworkform.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:false,
      fullscreen: useFullScreen
    })
    .then(function(answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function() {
      $scope.status = 'You cancelled the dialog.';
    });

  };



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

  function getMyGroups(){
    $http({
      url: '/api/teacher/groups/fromtc',
      method: "GET",
    })
    .then(function(response) {
      $scope.myGroups = response.data.teachGroups;
      //       console.log("GET TEACHER'S GROUP SUCCESS");
    },
    function(response) { // optional
      console.log(response)
    });
  }
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

.controller('NewHWDialogController', function($rootScope, $scope, $http, $mdDialog, $mdMedia) {
  $scope.subjects = ["數學","中文","英文","通識"]

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

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

  function containsObject(obj, list) {
    for (i = 0; i < list.length; i++) {
      if (list[i]["schoolid"] == obj["schoolid"]) {
        return true;
      }
    }
    return false;
  }

  function arrayContains(needle, arrhaystack)
  {
    return (arrhaystack.indexOf(needle) > -1);
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
    //     return veggies.map(function(veg) {
    //       veg._lowername = veg.name.toLowerCase();
    //       veg._lowertype = veg.type.toLowerCase();
    //       return veg;
    //     });
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
})

.controller('GroupModalController', function($scope, $http, $mdDialog, $mdMedia, group) {
  getGroupDetails();
  $scope.group = group;

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.updateName = function(updatedName){

    if(updatedName){
      if($scope.gDetails.name !== updatedName){
        $http({
          url: '/api/teacher/update/group/' + $scope.gDetails._id + '/name',
          method: "POST",
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
          method: "POST",
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
      $scope.gDetails = response.data;
      //       console.log("get group's details success");
    },
    function(response) { // optional
      console.log("fail to get group's details")
    });
  };

})
.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});
