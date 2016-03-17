angular.module('ipkms')
.directive('teacherSideDrawer', function() {
  return {
    templateUrl: '/html/teacher-side-drawer.html'
  };
})
.directive('tQuestions', function() {
  return {
    templateUrl: '/html/questions/t-questions.tmpl.html',
    controller: 'tQuestionsController'
  };
})
.directive('ngReallyClick', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        var message = attrs.ngReallyMessage;
        if (message && confirm(message)) {
          scope.$apply(attrs.ngReallyClick);
        }
      });
    }
  }
})
.directive('compile', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
        scope.$watch(
            function(scope) {
                // watch the 'compile' expression for changes
                return scope.$eval(attrs.compile);
            },
            function(value) {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);

                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
            }
        );
    };
}])
