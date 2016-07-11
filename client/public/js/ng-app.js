angular.module('ipkmsMain', ['ngMaterial', 'ngMessages'])
.config(function ($interpolateProvider, $httpProvider) {

  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');

  $httpProvider.interceptors.push('authInterceptor');

})
.factory('authInterceptor', function ($rootScope, $q, $window, $location) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers['x-access-token'] = $window.sessionStorage.token;
      } else if (getParameterByName('token')) {
        config.headers['x-access-token'] = getParameterByName('token')
      }

      return config;
    },
    response: function(response){
      if (response.status === 401) {
        console.log("Response 401");
      }
      return response || $q.when(response);
    },
    responseError: function(rejection) {
      if (rejection.status === 401 && rejection.data.authorize === false) {
        console.log("Response Error 401", rejection);
        window.location = '/'
      }
      console.log($location.search('token'))

      return $q.reject(rejection);
    }
  };
});

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
