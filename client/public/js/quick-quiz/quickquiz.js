angular.module('quickquiz', ['ipkms', 'ipkmsService', 'katex'])

    .controller('mainController', function ($rootScope, $scope, apiService) {

        $scope.quickquizId = null;
        $scope.quickquiz = [];
        $scope.answers = [];
        $scope.finishedQuestionsCount = 0;

        $scope.rights = [];
        $scope.wrongs = [];
        $scope.exceptions = [];

        $scope.submitted = false;

        $scope.correctAnswers = [];


        if (getUrlVars()["id"]) {
            $scope.quickquizId = getUrlVars()["id"];
            getQuickquiz(getUrlVars()["id"]);
        } else {
            console.log('no params')
        }

        function getQuickquiz(id) {

            var apiURL = '/api/manage-quickquiz/student/quickquiz' + '?id=' + id;
            apiService.get(apiURL).then(function (response) {
                if (response.data) {
                    $scope.quickquiz = response.data;
                    if (response.data.questions) {
                        for (i = 0; i < response.data.questions.length; i++) {
                            $scope.answers.push(null)
                        }
                    }
                    console.log(response.data)
                } else {
                    console.log('empty response data')
                }
            }, function (response) {
                console.log(response.data)
            })
        };

        function getUrlVars() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        }

        $scope.renderQuestions = function () {
            setTimeout(function renderQuestionCard() {
                renderMathInElement(
                    document.getElementById('questions'),
                    {
                        delimiters: [
                            {left: "$$", right: "$$", display: false},
                            {left: "\\[", right: "\\]", display: true}
                        ]
                    }
                );
            }, 0);

        };

        $scope.answerOnChoose = function (index, pos) {
            if (!$scope.submitted) {
                $scope.answers[index] = pos;
                countfinishedQuestions();
            }
        };

        $scope.handIn = function () {

            if ($scope.quickquizId) {
                var data = {
                    id: $scope.quickquizId,
                    answers: $scope.answers
                };

                var apiURL = '/api/manage-quickquiz/student/quickquiz';
                apiService.postJSON(apiURL, data).then(function (response) {
                    $scope.submitted = true;
                    if (response.data) {
                        console.log(response.data);
                        $scope.rights = response.data.checkAnswersRestults.right;
                        $scope.wrongs = response.data.checkAnswersRestults.wrong;
                        $scope.correctAnswers = response.data.correctAnswers;
                    } else {
                        console.log('empty response data')
                    }
                }, function (response) {
                    console.log(response.data)
                })
            }

        };

        $scope.checkChoose = function (index, choose) {
            return $scope.answers[index] === choose;
        };

        $scope.checkRight = function (index) {
            return $scope.rights.indexOf(index) > -1;
        };

        $scope.checkWrong = function (index) {
            return $scope.wrongs.indexOf(index) > -1;
        };

        $scope.checkException = function (index) {
            return $scope.exceptions.indexOf(index) > -1;
        };

        $scope.showRight = function (index, choose) {
            return (($scope.checkRight(index) && $scope.checkChoose(index, choose)) || (!$scope.checkRight(index) && choose === $scope.correctAnswers[index]))
        };

        $scope.showWrong = function (index, choose) {
            return $scope.checkWrong(index) && $scope.checkChoose(index, choose)
        }


        function countfinishedQuestions () {
            var count = 0;
            for (i = 0; i < $scope.answers.length; i++) {
                if ($scope.answers[i] !== null) {
                    count++
                }
            }

            setTimeout(function() {
                $scope.finishedQuestionsCount = count;
                $scope.$apply();
            }, 0);

        }
    })
    .filter('unsafe', function ($sce) {
        return $sce.trustAsHtml;
    });