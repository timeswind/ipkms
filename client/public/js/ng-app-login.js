angular.module('ipkms')
.controller('loginController', function($scope,$http, $window) {
  $scope.teacher = {
    email: '',
    password: ''
  }

  $scope.student = {
    schoolid: '',
    password: ''
  }

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
      if (data == "fail") {
        $scope.teacherLoginError = "郵箱或密碼錯誤"
      }
      delete $window.sessionStorage.token;
      // Handle login errors here
    });
  };

  $scope.submitStudent = function () {
    $http
    .post('/login/student', $scope.student)
    .success(function (data, status, headers, config) {
      $window.sessionStorage.token = data.token;
      window.location = "/home"
    })
    .error(function (data, status, headers, config) {
      // Erase the token if the user fails to log in
      if (data == "fail") {
        $scope.studentLoginError = "郵箱或密碼錯誤"
      }
      delete $window.sessionStorage.token;
      // Handle login errors here
    });
  };

})
