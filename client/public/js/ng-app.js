angular.module('ipkms', ['ngMaterial','ngMessages'])
.config(function($interpolateProvider, $httpProvider, $mdThemingProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');

  $httpProvider.interceptors.push('authInterceptor');

  $mdThemingProvider.theme('docs-dark', 'default')
  .primaryPalette('yellow')
  .dark();
})
.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers['x-access-token'] = $window.sessionStorage.token;
        // config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    }
    // response: function (response) {
    //   if (response.status === 401) {
    //     // handle the case where the user is not authenticated
    //   }
    //   return response || $q.when(response);
    // }
  };
});
