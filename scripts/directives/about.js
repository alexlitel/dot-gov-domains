app.directive('about', function() {
    return {
        templateUrl: 'templates/about.html',
        controller: 'mainCtrl',
        link: function($scope, $element, attrs) {
           $scope.close = function() {
           	angular.element($element).remove();
           };
        },
        replace: true
    };

});
