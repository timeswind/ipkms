angular.module('ipkms')

.controller('manageTeachers', function($rootScope, $scope, $http, apiService) {
  getTeachers();

  function getTeachers(){
    $http({
      method: 'GET',
      url: '../api/teachers'
    }).then(function successCallback(response) {

      $scope.teachers = response.data;
      console.log(response.data);

    }, function errorCallback(response) {
      console.log("error to get user, maybe not login");
    });
  }

  $scope.deleteTeacher = function(userId){

    apiService.deleteWithParams('/api/manage-account/user-teacher', userId).then(function(response) {
      getTeachers();
      $rootScope.$broadcast('refreshUserList');
    });

    // $http({
    //   method: 'DELETE',
    //   url: '../api/teacher/' + userId + "/" + teacherId
    // }).then(function successCallback(response) {
    //   getTeachers();
    //   $rootScope.$broadcast('refreshUserList');
    //
    //   console.log(response);
    //
    // }, function errorCallback(response) {
    //   console.log(response);
    // })
  }

  $scope.$on('refreshTeacherList', function(event, args) {
    getTeachers();
  });

})
.controller('manageUsers', function($rootScope, $scope, $http, apiService) {
  getUsers();

  function getUsers(){
    $http({
      method: 'GET',
      url: '../api/users'
    }).then(function successCallback(response) {

      $scope.users = response.data;
      console.log(response.data);

    }, function errorCallback(response) {
      console.log("error to get user, maybe not login");
    })
  };


  $scope.deleteUser = function(userId){
    $http({
      method: 'DELETE',
      url: '../api/users/' + userId
    }).then(function successCallback(response) {
      getUsers();

      console.log(response);

    }, function errorCallback(response) {
      console.log(response);
    })
  }

  $scope.addTeacher = function(userId){

    apiService.post('/api/manage-account/user-teacher', userId).then(function(response) {
      $rootScope.$broadcast('refreshTeacherList');
      getUsers();
      console.log(response);
    });

  }

  $scope.$on('refreshUserList', function(event, args) {
    getUsers();
  });


})

.controller('manageStudents', function($rootScope, $scope, $http, apiService) {
  getStudents();

  function getStudents(){
    $http({
      method: 'GET',
      url: '../api/students'
    }).then(function successCallback(response) {

      $scope.students = response.data;
      console.log(response.data);

    }, function errorCallback(response) {
      console.log("error to get user, maybe not login");
    });

  };

  $scope.deleteStudent = function(studentId){
    $http({
      method: 'DELETE',
      url: '../api/student/' + studentId
    }).then(function successCallback(response) {
      getStudents();
      $rootScope.$broadcast('refreshUserList');

      console.log(response);

    }, function errorCallback(response) {
      console.log(response);
    })
  }

  $scope.createStudents = function(){
    var data = JSON.parse($scope.schoolids);
    console.log(data);
    $http({
      url: '../api/students/multi',
      method: "POST",
      data: $.param({data}),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}

    })
    .then(function(response) {
      // successconso
      console.log(response);
    },
    function(response) { // optional
      // failed
    });
  }

})
