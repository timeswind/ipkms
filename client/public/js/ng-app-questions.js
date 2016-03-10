angular.module('ipkms')
.controller('questionsController', function($scope, apiService, subjectsService, $timeout, $sce) {

  $scope.newquestion = {
    type : 'mc',
    subject : undefined,
    context : undefined,
    choices : [],
    answer : {
      mc : '',
      long : ''
    },
    tags : []
  }

  $scope.subjects = subjectsService.subjects;


  $scope.updatePreview = function(){
    // $scope.questionPreview = $sce.trustAsHtml($scope.newquestion.context)
    document.getElementById('questionPreview').innerHTML = $scope.newquestion.context;
    renderMathInElement(
    document.getElementById("questionPreview"),
    {
        delimiters: [
            {left: "$$", right: "$$", display: false},
            {left: "\\[", right: "\\]", display: true}
        ]
    }
);
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
    toolbar: 'undo redo | underline bold italic | bullist numlist'
  };

  $scope.mcInputOptions = {
    language: 'zh_TW',
    menubar: false,
    statusbar: false,
    toolbar: 'undo redo'
  };

  $scope.createNewQuestion = function(){
    if ($scope.newquestion.type === "mc") {

      var checkMcComplete = ($scope.newquestion.choices.length === 4)
      if ($scope.newquestion.subject && $scope.newquestion.context && checkMcComplete) {
        apiService.postJSON("/api/manage-question/new", angular.toJson($scope.newquestion)).then(function(response) {
          // success
          showSuccessSnakebar("發佈成功")
          $scope.newquestion.context = undefined;
          $scope.newquestion.choices = [];
          document.getElementById('questionPreview').innerHTML = "<div></div>";


        },
        function(response) {
          // failed
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

  function showSuccessSnakebar(message){
    var snackbarContainer = document.querySelector('#snackbar-success');
    var data = {
      message: message,
      timeout: 2000
    };
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }






})
