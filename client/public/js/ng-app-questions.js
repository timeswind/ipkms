angular.module('ipkms')
.controller('questionsController', function($scope, apiService, subjectsService, $timeout, $sce) {
  getLatestTenQuestions();

  $scope.newquestion = {
    type : 'mc',
    subject : undefined,
    context : undefined,
    choices : [],
    answer : {
      mc : 0,
      long : ''
    },
    tags : []
  }

  $scope.subjects = subjectsService.subjects;

  $scope.idToName = function(id){
    return subjectsService.idToName(id)
  }


  $scope.updateContextPreview = function(){
    // $scope.questionPreview = $sce.trustAsHtml($scope.newquestion.context)
    // document.getElementById('questionPreview').innerHTML = $scope.newquestion.context;
    // renderMathInElement(
    //   document.getElementById("questionPreview"),
    //   {
    //     delimiters: [
    //       {left: "$$", right: "$$", display: false},
    //       {left: "\\[", right: "\\]", display: true}
    //     ]
    //   }
    // );

    setTimeout(function renderMcPreview(){
      renderMathInElement(
        document.getElementById('questionPreview'),
        {
          delimiters: [
            {left: "$$", right: "$$", display: false},
            {left: "\\[", right: "\\]", display: true}
          ]
        }
      );
    }, 0);
  }

  $scope.updateMcPreview = function() {
    console.log("update");
    setTimeout(function renderMcPreview(){
      renderMathInElement(
        document.getElementById('mc-preview-container'),
        {
          delimiters: [
            {left: "$$", right: "$$", display: false},
            {left: "\\[", right: "\\]", display: true}
          ]
        }
      );
    }, 0);
  }

  $scope.contextInputOptions = {
    language: 'zh_TW',
    menubar: false,
    statusbar: false,
    plugins : 'insertMath',
    toolbar: 'undo redo | underline bold italic | bullist numlist | insertMath'
  };

  $scope.longAnswerInputOptions = {
    language: 'zh_TW',
    menubar: false,
    statusbar: false,
    plugins : 'insertMath',
    toolbar: 'undo redo | underline bold italic | bullist numlist | insertMath'
  };

  $scope.mcInputOptions = {
    language: 'zh_TW',
    menubar: false,
    statusbar: false,
    plugins : 'insertMath',
    toolbar: 'undo redo | insertMath'
  };

  $scope.createNewQuestion = function(){
    if ($scope.newquestion.type === "mc") {

      var checkMcComplete = ($scope.newquestion.choices.length === 4)
      if ($scope.newquestion.subject && $scope.newquestion.context && checkMcComplete) {
        apiService.postJSON("/api/manage-question/new", angular.toJson($scope.newquestion)).then(function(response) {
          showSuccessSnakebar("發佈成功")
          $scope.newquestion.context = undefined;
          $scope.newquestion.choices = [];
          $scope.newquestion.difficulty = 0;
        },
        function(response) {
          showSuccessSnakebar("發佈失敗")
        });
      } else {
        showSuccessSnakebar("信息缺漏")
      }

    } else {

      if ($scope.newquestion.subject && $scope.newquestion.context && $scope.newquestion.answer.long) {
        console.log("good to go");
      } else {
        showSuccessSnakebar("信息缺漏")
      }
    }

  }

  function getLatestTenQuestions(){
    apiService.get('/api/manage-question/latest').then(function(response) {
      // success
      console.log(response.data);
      $scope.latestQuestions = response.data;

    },
    function(response) {
      showSuccessSnakebar("獲取最新發佈的題目出錯")

    });
  }

  function showSuccessSnakebar(message){
    var snackbarContainer = document.querySelector('#snackbar-success');
    var data = {
      message: message,
      timeout: 2000
    };
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }

  $scope.to_trusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
  }

  $scope.renderQuestionCard = function(){

    setTimeout(function renderQuestionCard(){
      renderMathInElement(
        document.getElementById('question-preview-container'),
        {
          delimiters: [
            {left: "$$", right: "$$", display: false},
            {left: "\\[", right: "\\]", display: true}
          ]
        }
      );
    }, 0);

  }

  $scope.getNumberArray = function(num) {
    return new Array(num);
  }

})
