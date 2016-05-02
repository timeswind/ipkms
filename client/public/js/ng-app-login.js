angular.module('login', ['ipkms', 'ipkmsService'])
    .controller('loginController', function ($scope, $http, $window) {

        $scope.teacher = {
            email: '',
            password: ''
        };

        $scope.student = {
            schoolid: '',
            password: ''
        };

        $scope.loginType = "教師登入";
        $scope.loginOption = "學生登入";

        $scope.studentLogin = false;

        $scope.switchLogin = function () {
            $scope.studentLogin = !$scope.studentLogin;
            if ($scope.studentLogin) {
                $scope.loginOption = "教師登入";
                $scope.loginType = "學生登入";

            } else {
                $scope.loginOption = "學生登入";
                $scope.loginType = "教師登入";
            }
        };

        $scope.login = function () {
            if ($scope.studentLogin) {
                if ($scope.student.schoolid && $scope.student.password) {
                    $http
                        .post('/login/student', $scope.student)
                        .success(function (data) {
                            $window.sessionStorage.token = data.token;
                            window.location = "/home"
                        })
                        .error(function () {

                            $scope.LoginError = "學生ID或密碼錯誤";
                            delete $window.sessionStorage.token;

                        });
                }
            } else {
                if ($scope.teacher.email && $scope.teacher.password) {
                    $http
                        .post('/login', $scope.teacher)
                        .success(function (data) {

                            $window.sessionStorage.token = data.token;
                            window.location = "/home"

                        })
                        .error(function () {

                            $scope.LoginError = "郵箱或密碼錯誤";
                            delete $window.sessionStorage.token;

                        });
                }
            }

        };

    });
