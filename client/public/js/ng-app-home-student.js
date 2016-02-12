angular.module('ipkms')

  .controller('groupController', function($scope, $http) {
  getMyGroups();
  $scope.checkNotice = function(notice){
    if(notice !== undefined){
      if(notice !== " "){
        return "公告：" + notice;
      }
    }

  }
  function getMyGroups(){ //get groups that student involved
    $http({
      url: '/api/studentgroups',
      method: "GET",
    })
      .then(function(response) {
      $scope.myGroups = response.data;
      console.log("GET STUDNET'S GROUP SUCCESS");
    },
            function(response) { // optional
      console.log("fail to get student's groups")
    });
  }

})
