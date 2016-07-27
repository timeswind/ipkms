angular.module('ipkms.profile', ['ipkmsMain', 'ipkmsService'])
.controller('ProfileController', function ($rootScope, $scope, apiService) {
  console.log('profile')
  apiService.get('/api/manage-account/profile').then(function(response) {
      console.log(response)
  })
})
