angular.module('ipkmsMain')

.controller('groupController', function($scope, $http, $mdDialog, $mdMedia, apiService) {
  getMyGroups();
  $scope.checkNotice = function(notice){
    if(notice !== undefined){
      if(notice !== " "){
        return "公告：" + notice;
      }
    }

  }

  $scope.showGroupDialog = function(ev, g) {
    $scope.group = g;
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
    $mdDialog.show({
      templateUrl: '/html/student-group-modal.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      locals: {
        group: $scope.group
      },
      controller: "GroupModalController"
    })

  };

  function getMyGroups(){ //get groups that student involved

    apiService.get('/api/studentgroups').then(function(response) {
      $scope.myGroups = response.data;
    },function(response) { // optional
      console.log("fail to get student's groups")
    });
  }

})
.controller('GroupModalController', function($scope, $http,$mdDialog, $mdMedia, group, apiService, subjectsService ) {
  getGroupDetails()
  $scope.group = group
  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.idToName = function(id) {
    return subjectsService.idToName(id)
  }

  function getGroupDetails(){
    var apiURL = '/api/student/group/' + group._id
    apiService.get(apiURL).then(function(response) {
      console.log(response);
      $scope.gDetails = response.data;
    },
    function(response) { // optional
      console.log("fail to get group's details")
    });
  };

})
