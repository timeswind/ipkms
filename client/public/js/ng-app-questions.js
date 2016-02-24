angular.module('ipkms')
.controller('questionsController', function($scope, apiService, subjectsService) {
  $scope.settings = {
    createMode : 1,
    subject : undefined,
    tags : []
  }
  $scope.subjects = subjectsService.subjects;

  $scope.createMode = '1';
})
