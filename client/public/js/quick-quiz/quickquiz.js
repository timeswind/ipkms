angular.module('ipkms.quickquiz', ['ipkmsMain', 'ipkmsService', 'katex'])

    .controller('MainController', function ($rootScope, $scope, apiService, socket) {

        $scope.errorMessage = null;

        $scope.resultCard = null;

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

        $scope.preDoQuiz = false;
        $scope.gettingQuestions = false;

        $scope.socket = {
            authenticated: false,
            joined: false
        };

        if (getUrlVars()["id"]) {
            $scope.quickquizId = getUrlVars()["id"];
            getQuickquiz(getUrlVars()["id"]);
        } else {
            console.log('no params')
        }

        socket.on('connect', function () {
            if (getUrlVars()["id"]) {
                socket.emit('authenticate', {token: window.sessionStorage.token});
            }
        });


        socket.on('authenticated', function () {
            $scope.socket.authenticated = true;
            var data = {
                quickquizId: $scope.quickquizId
            };
            if ($scope.preDoQuiz === false && !$scope.submitted) {
                data['status'] = 'doing'
            }
            socket.emit('user join', data)
        });

        socket.on('joined', function () {
            $scope.socket.joined = true;
        });

        socket.on('request observe', function (data) {
            if (data.teacher_id) {
                var teacher_id = data.teacher_id;
                var respondData = {
                    teacher_id: teacher_id,
                    answers: $scope.answers
                };
                socket.emit('response observe', respondData)
            }
        });


        function getQuickquiz(id) {

            var apiURL = '/api/manage-quickquiz/quickquiz' + '?id=' + id;
            apiService.get(apiURL).then(function (response) {
                if (response.status === '401') {
                    console.log('user is not student, have no permission to do the quickquiz');
                    $scope.errorMessage = 'You have no permission to do this quick quiz!'
                } else if (response.data) {
                    if (response.data.questions) {
                        if (response.data.reqRole === 'teacher') {
                            $scope.quickquiz = response.data;
                            for (var i = 0; i < response.data.questions.length; i++) {
                                $scope.answers.push(null)
                            }
                            $scope.correctAnswers = response.data.correctAnswers;
                        } else if (response.data.reqRole === 'student') {
                            $scope.preDoQuiz = true;
                            $scope.submitted = false;
                            $scope.quickquiz = response.data;
                            for (var j = 0; j < response.data.questions.length; j++) {
                                $scope.answers.push(null)
                            }
                        }
                    } else if (response.data.finishTime) {
                        $scope.resultCard = response.data;
                        console.log(response.data);
                        $scope.answers = response.data.answers;
                        console.log('receive the result of the quickquiz')
                    } else if (response.data === 'finished') {
                        console.log('小测已经结束');
                        $scope.errorMessage = '小測已經結束!'
                    }
                } else {
                    console.log('empty response data');
                    $scope.errorMessage = '好像出了一些问题:('
                }
            }, function (response) {
                if (response.data.finishTime) {
                    $scope.resultCard = response.data;
                    $scope.answers = response.data.answers;
                    console.log('receive the result of the quickquiz')
                } else if (response.data === 'finished') {
                    console.log('小测已经结束');
                    $scope.errorMessage = '小測已經結束!'
                } else {
                    $scope.errorMessage = '什麼也沒有找到'
                }
            })
        }

        $scope.startQuickQuiz = function () {
            var apiURL = '/api/manage-quickquiz/student/quickquiz/start';
            var data = {
                quickquiz_id: $scope.quickquizId
            };
            apiService.postJSON(apiURL, data).then(function (response) {
                $scope.preDoQuiz = false;
                if ($scope.socket.authenticated && $scope.socket.joined) {
                    var data = {
                        quickquizId: $scope.quickquizId,
                        quizsampleId: response.data
                    };
                    socket.emit('start doing', data);
                }
            }, function (response) {
                // err handle
            })
        };

        $scope.getQuestions = function () {
            if (!$scope.quickquiz) {
                $scope.gettingQuestions = true;
                var id = $scope.quickquizId;
                var apiURL = '/api/manage-quickquiz/student/quickquiz/questions' + '?id=' + id;
                apiService.get(apiURL).then(function (response) {
                    $scope.gettingQuestions = false;
                    $scope.quickquiz = response.data;
                    var correctAnswers = [];

                    for (var i = 0; i < $scope.quickquiz.questions.length; i++) {
                        if (typeof $scope.quickquiz.questions[i] === 'object') {
                            if ($scope.quickquiz.questions[i].type === 'mc') {
                                correctAnswers.push($scope.quickquiz.questions[i].answer.mc);
                            } else {
                                correctAnswers.push(null);
                            }
                        } else {
                            correctAnswers.push(null);
                        }

                    }

                    console.log(response.data);
                    $scope.rights = $scope.resultCard.results.right;
                    $scope.wrongs = $scope.resultCard.results.wrong;
                    $scope.blanks = $scope.resultCard.results.blank;
                    $scope.correctAnswers = correctAnswers;
                }, function (response) {
                    if (response.data === 'permission denied') {
                        $scope.errorMessage = '未參與過該小測'
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

        $scope.answerOnChoose = function (question_index, mc_choice_index) {
            if (!$scope.submitted) {
                var quickquiz_id = $scope.quickquizId;
                var question_type = 'mc';
                if ($scope.answers[question_index] === mc_choice_index) {
                    $scope.answers[question_index] = null;
                    $scope.finishedQuestionsCount--;
                } else {
                    $scope.finishedQuestionsCount++;
                    $scope.answers[question_index] = mc_choice_index;
                }
                var data = {
                    quickquizId: quickquiz_id,
                    type: question_type,
                    answer: [question_index, mc_choice_index],
                    answers: $scope.answers
                };
                socket.emit('question on fill', data)
            }
        };

        $scope.handIn = function () {
            $scope.submitted = true;

            if ($scope.quickquizId) {
                var data = {
                    id: $scope.quickquizId,
                    answers: $scope.answers
                };

                var apiURL = '/api/manage-quickquiz/quickquiz';
                apiService.postJSON(apiURL, data).then(function (response) {
                    console.log(response.data);
                    if (response.data && response.data.checkAnswersRestults && response.data.correctAnswers) {
                        socket.emit('finish doing', {quickquizId: $scope.quickquizId});
                        $scope.rights = response.data.checkAnswersRestults.right;
                        $scope.wrongs = response.data.checkAnswersRestults.wrong;
                        $scope.blanks = response.data.checkAnswersRestults.blank;
                        $scope.correctAnswers = response.data.correctAnswers;
                    } else if (!response.data) {
                        $scope.errorMessage = '未知错误: 没有收到批改结果'
                    } else {
                        $scope.errorMessage = '未知错误: 批改結果不完整'
                    }
                }, function (response) {
                    $scope.submitted = false;

                    if (response.data === 'already handin') {
                        $scope.errorMessage = '你已经提交过了!'
                    } else {
                        $scope.errorMessage = '未知错误:' + JSON.parse(response.data)
                    }
                })
            } else {
                $scope.submitted = false;
                $scope.errorMessage = '未知错误!'
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
        };

        $scope.isObject = function (thing) {
            return typeof thing === 'object'
        };

    })
    .filter('unsafe', function ($sce) {
        return $sce.trustAsHtml;
    });
