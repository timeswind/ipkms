angular.module('student', ['ngMaterial','ngMessages'])
  .config(function($interpolateProvider, $httpProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
  //Reset headers to avoid OPTIONS request (aka preflight)
  $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {};
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
})

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
      console.log($scope.myGroups);
      console.log("GET STUDNET'S GROUP SUCCESS");
    },
            function(response) { // optional
      console.log("fail to get student's groups")
    });
  }

})
