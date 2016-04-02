angular.module('ipkms', ['ipkmsService','ngMaterial','ngMessages','ui.tinymce','katex'])
.config(function($interpolateProvider, $httpProvider, $mdThemingProvider){
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');

  $httpProvider.interceptors.push('authInterceptor');

})
.factory('authInterceptor', function ($rootScope, $q, $window) {
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
    // response: function (response) {
    //   console.log(response)
    //   if (response.status == 401) {
    //     console.log("401")
    //   }
    //   return response || $q.when(response);
    // }
  };
});
