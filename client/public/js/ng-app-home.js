angular.module('home', ['ngMaterial','ngMessages'])
  .config(function($interpolateProvider, $httpProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
  //Reset headers to avoid OPTIONS request (aka preflight)
  $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {};
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
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
      console.log("fail to get teacher's groups")
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
  self.selectedVegetables = [];
  self.selectedSchoolids = [];
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

    if(!arrayContains(stu.schoolid, self.selectedSchoolids)){
      console.log(stu);
      self.selectedVegetables.push(stu);
      self.selectedSchoolids.push(stu.schoolid);
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
      self.vegetables = loadVegetables();
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
      var results = query ? self.vegetables.filter(createFilterFor(query)) : [];
      return results;
    }
  }

  /**
  * Create filter function for a query string
  */
  function createFilterFor(query) {
    console.log(query);
    //     var lowercaseQuery = angular.lowercase(query); //for english only
    return function filterFn(vegetable) {
      return (vegetable.name.indexOf(query) != -1) ||
        (vegetable.schoolid.indexOf(query) != -1);
    };

  }

  function loadVegetables() {
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
      "students" : self.selectedVegetables
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
  }
})







