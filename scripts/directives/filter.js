app.directive('filter', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/filter.html',
        scope: {
            opttype: '@',
            optprop: '@',
            optsafe: '@'
        },
        link: function(scope, element, attrs) {
            scope.removeFilter = function(event) {
                var a = element.attr('data-filter');
                scope.$parent.selectForm.currFilters.splice(scope.$parent.selectForm.options.indexOf(a), 1);
                scope.$parent.selectForm.options.push(a);
                scope.$parent.selectForm.selectedOption = scope.$parent.selectForm.options[0];
                scope.$destroy();
                element.remove();

            };
        },
        replace: true
    };

});
