angular.module('ipkmsAdmin', ['ipkmsService', 'ui.bootstrap'])
.config(function($interpolateProvider, $httpProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');

  $httpProvider.interceptors.push('authInterceptor');
})
.factory('authInterceptor', function ($window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers['x-access-token'] = $window.sessionStorage.token;
      } else {
        window.location = '/'
      }

      return config;
    }
  };
});
