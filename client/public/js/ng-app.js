angular.module('ipkmsMain', ['ngMaterial', 'ngMessages'])
    .config(function ($interpolateProvider, $httpProvider) {

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
                return $q.reject(rejection);
            }
        };
    });
