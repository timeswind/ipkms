angular.module('quickquiz', ['ipkms', 'ipkmsService', 'katex'])

    .controller('mainController', function ($rootScope, $scope, apiService) {

        $scope.errorCard = {
            message: null
        };

        $scope.resultCard = {
            results: null
        };

        $scope.quickquizId = null;
        $scope.quickquiz = null;
        $scope.answers = [];
        $scope.finishedQuestionsCount = 0;

        $scope.rights = [];
        $scope.wrongs = [];
        $scope.blanks = [];
        $scope.exceptions = [];

        $scope.submitted = true;

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
                if (response.status === '401') {
                    console.log('user is not student, have no permission to do the quickquiz');
                    $scope.errorCard.message = 'You have no permission to do this quick quiz!'
                } else if (response.data) {
                    if (response.data.questions) {
                        $scope.submitted = false;
                        $scope.quickquiz = response.data;
                        for (var i = 0; i < response.data.questions.length; i++) {
                            $scope.answers.push(null)
                        }
                    } else if (response.data.finishTime) {
                        $scope.resultCard.results = response.data;
                        $scope.answers = response.data.answers;
                        console.log('receive the result of the quickquiz')
                    } else if (response.data === 'finished') {
                        console.log('小测已经结束');
                        $scope.errorCard.message = '小測已經結束!'
                    }
                } else {
                    console.log('empty response data');
                    $scope.errorCard.message = '好像出了一些问题:('
                }
            }, function (response) {
                if (response.data.finishTime) {
                    $scope.resultCard.results = response.data;
                    $scope.answers = response.data.answers;
                    console.log('receive the result of the quickquiz')
                } else if (response.data === 'finished') {
                    console.log('小测已经结束');
                    $scope.errorCard.message = '小測已經結束!'
                } else {
                    $scope.errorCard.message = '什麼也沒有找到:('
                }
            })
        }

        $scope.getQuestions = function () {
            if (!$scope.quickquiz) {
                var id = $scope.quickquizId;
                var apiURL = '/api/manage-quickquiz/student/quickquiz/questions' + '?id=' + id;
                apiService.get(apiURL).then(function (response) {
                    $scope.quickquiz = response.data;
                    $scope.correctAnswers = response.data.correctAnswers;
                }, function (response) {
                    if (response.data === 'permission denied') {
                        $scope.errorCard.message = '未參與過該小測'
                    }
                })
            }
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
                    console.log(response.data);
                    $scope.submitted = true;
                    if (response.data && response.data.checkAnswersRestults && response.data.correctAnswers) {
                        $scope.rights = response.data.checkAnswersRestults.right;
                        $scope.wrongs = response.data.checkAnswersRestults.wrong;
                        $scope.blanks = response.data.checkAnswersRestults.blank;
                        $scope.correctAnswers = response.data.correctAnswers;
                    } else if (!response.data) {
                        $scope.errorCard.message = '未知错误: 没有收到批改结果'
                    } else {
                        $scope.errorCard.message = '未知错误: 批改結果不完整'
                    }
                }, function (response) {
                    if (response.data === 'already handin') {
                        $scope.errorCard.message = '你已经提交过了!'
                    } else {
                        $scope.errorCard.message = '未知错误:' + JSON.parse(response.data)
                    }
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


        function countfinishedQuestions() {
            var count = 0;
            for (i = 0; i < $scope.answers.length; i++) {
                if ($scope.answers[i] !== null) {
                    count++
                }
            }

            setTimeout(function () {
                $scope.finishedQuestionsCount = count;
                $scope.$apply();
            }, 0);

        }
    })
    .filter('unsafe', function ($sce) {
        return $sce.trustAsHtml;
    });