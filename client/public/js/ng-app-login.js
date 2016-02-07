angular.module('login', [])
  .config(function($interpolateProvider, $httpProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
  //Reset headers to avoid OPTIONS request (aka preflight)
  $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {};
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
})
  .controller('loginController', function($scope) {
  $scope.loginOption = "學生登錄"
  $scope.studentLogin = false;

  $scope.switchLogin = function(){
    $scope.studentLogin = !$scope.studentLogin;
    if($scope.studentLogin){
      $scope.loginOption = "教師登錄"

    }else{
      $scope.loginOption = "學生登錄"

    }
  }

})
