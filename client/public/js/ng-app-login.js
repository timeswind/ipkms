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

        $scope.loginOption = "學生登入";
        $scope.studentLogin = false;

        $scope.switchLogin = function () {
            $scope.studentLogin = !$scope.studentLogin;
            if ($scope.studentLogin) {
                $scope.loginOption = "教師登入"

            } else {
                $scope.loginOption = "學生登入"

            }
        };

        $scope.submitTeacher = function () {
            if ($scope.teacher.email && $scope.teacher.password) {
                $http
                    .post('/login', $scope.teacher)
                    .success(function (data) {

                        $window.sessionStorage.token = data.token;
                        window.location = "/home"
                        
                    })
                    .error(function () {

                        $scope.teacherLoginError = "郵箱或密碼錯誤";
                        delete $window.sessionStorage.token;

                    });
            }
        };

        $scope.submitStudent = function () {
            if ($scope.student.schoolid && $scope.student.password) {
                $http
                    .post('/login/student', $scope.student)
                    .success(function (data) {
                        $window.sessionStorage.token = data.token;
                        window.location = "/home"
                    })
                    .error(function () {

                        $scope.studentLoginError = "學生ID或密碼錯誤";
                        delete $window.sessionStorage.token;

                    });
            }
        };

    });
