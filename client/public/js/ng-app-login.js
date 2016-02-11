angular.module('login', [])
  .config(function($interpolateProvider, $httpProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');

  $httpProvider.interceptors.push('authInterceptor');
  //Reset headers to avoid OPTIONS request (aka preflight)
  // $httpProvider.defaults.headers.common = {};
  // $httpProvider.defaults.headers.post = {};
  // $httpProvider.defaults.headers.put = {};
  // $httpProvider.defaults.headers.patch = {};
})
  .controller('loginController', function($scope,$http, $window) {
  $scope.teacher = {
    email: '',
    password: ''};

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

  $scope.submitTeacher = function () {
    $http
      .post('/login', $scope.teacher)
      .success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;
        window.location = "/home"
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.sessionStorage.token;
        // Handle login errors here
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
