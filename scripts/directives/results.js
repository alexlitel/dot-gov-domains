app.directive('results', function($compile, $filter, $location, $anchorScroll) {
    return {
        restrict: 'E',
        controller: 'mainCtrl',
        templateUrl: 'templates/results.html',
        link: function(scope, $element, attrs) {

            scope.displayResults = scope.results;
            scope.filteredResults = scope.results;
            scope.resultsCount = scope.displayResults.length;
            scope.isFiltered = false;
            scope.activeResults = [];

            if (scope.results.length > 1) {
                if (scope.filterType === "Domain Name") {
                    scope.allResults = scope.displayResults;
                    scope.pagination = {};

                    scope.pageFunc = function(type) {
                        if (type === 'original') {
                            scope.pagination.pageMult = 0;
                        } else if (type === 'minus') {
                            scope.pagination.pageMult--;

                        } else if (type === 'plus') {
                            scope.pagination.pageMult++;
                        }
                        scope.pagination.pageStartCount = scope.pagination.pageMult * 500;
                        scope.pagination.pageMultEnd = scope.pagination.pageMult + 1;
                        scope.pagination.pageEndCount = (scope.resultsCount > scope.pagination.pageMultEnd * 500) ? scope.pagination.pageMultEnd * 500 : scope.resultsCount;
                        scope.displayResults = $filter('limitTo')(scope.allResults, scope.pagination.pageEndCount, scope.pagination.pageStartCount);
                        return scope.displayResults;
                    };

                    scope.pageFunc('original');
                }
            }

            scope.sortType = scope.filterType;
            scope.sortFunc = function(val) {
                return val[scope.sortType];
            };
            scope.reverse = false;

            if (scope.results.length > 1) {
                scope.selectForm = {
                    options: Object.keys(scope.results[0]).filter(function(item) {
                        return item !== "Domains";
                    }),
                    currFilters: [],

                    selectOption: function(option) {
                        if (option !== null) {
                            var test, safe, optionType;
                            test = scope.results[0];
                            safe = option.replace(/\s+/g, "").toLowerCase();
                            oType = typeof test[option];
                            if (test.hasOwnProperty(option) && typeof option === "string") {
                                angular.element(document.querySelector('.filters')).append($compile('<filter opttype="' + oType.substr(0, 3) + '" optprop="' + option + '" optsafe="' + safe + '"></filter')(scope.$new()));
                                scope.selectForm.currFilters.push(option);
                                scope.selectForm.options.splice(scope.selectForm.options.indexOf(option), 1);
                                scope.selectForm.selectedOption = null;
                            }
                        }
                    },


                    filterResults: function() {
                        if (scope.filteredResults !== scope.results) {
                            scope.filteredResults = scope.results;
                        }
                        scope.selectForm.currFilters.forEach(function(item) {
                            var safe, currScope, childScope, filterFunc;
                            safe = item.replace(/\s+/g, "").toLowerCase();
                            currScope = angular.element(document.querySelector('.filter-' + safe)).isolateScope();
                            childScope = currScope.$$childHead;

                            filterFunc = function(value, index, array) {

                                if (currScope.opttype === 'boo') {
                                    return (currScope.$$childTail.excludeCheck !== true) ? value[item] === childScope.radValue : value[item] !== childScope.radValue;
                                } else if (currScope.opttype === 'str') {
                                    if (childScope.textValue !== null) {
                                        var regex;
                                        if (childScope.radValue === 'begins') {
                                            regex = new RegExp('^' + childScope.textValue, 'i');
                                            return (currScope.$$childTail.excludeCheck !== true) ? regex.test(value[item]) : regex.test(value[item]) === false;
                                        } else if (childScope.radValue === 'ends') {
                                            if (currScope.optprop === 'Domain Name') {
                                                regex = new RegExp(childScope.textValue + '\.', 'gi');
                                                return (currScope.$$childTail.excludeCheck !== true) ? regex.test(value[item]) : regex.test(value[item]) === false;
                                            } else {
                                                regex = new RegExp(childScope.textValue + '$', 'i');
                                                return (currScope.$$childTail.excludeCheck !== true) ? regex.test(value[item]) : regex.test(value[item]) === false;
                                            }
                                        } else if (childScope.radValue === 'contains') {
                                            regex = new RegExp(childScope.textValue, 'gi');
                                            return (currScope.$$childTail.excludeCheck !== true) ? regex.test(value[item]) : regex.test(value[item]) === false;
                                        }
                                    }
                                } else if (currScope.opttype === 'num') {
                                    if (childScope.numValue !== null) {
                                        var bin;
                                        if (childScope.radValue === 'min') {
                                            bin = value[item] >= childScope.numValue;
                                            return (currScope.$$childTail.excludeCheck !== true) ? bin === true : bin === false;
                                        } else if (childScope.radValue === 'max') {
                                            bin = value[item] <= childScope.numValue;
                                            return (currScope.$$childTail.excludeCheck !== true) ? bin === true : bin === false;
                                        } else if (childScope.radValue === 'range') {
                                            if (childScope.numValue2 !== null) {
                                                bin = value[item] >= childScope.numValue && value[item] <= childScope.numValue2;
                                                return (currScope.$$childTail.excludeCheck !== true) ? bin === true : bin === false;
                                            }
                                        }
                                    }
                                }
                            };
                            if (childScope.radValue !== null) {
                                scope.filteredResults = $filter('filter')(scope.filteredResults, filterFunc);
                            }
                        });

                        scope.displayResults = scope.filteredResults;
                        scope.resultsCount = scope.displayResults.length;
                        if (scope.filterType === "Domain Name") {
                            scope.allResults = scope.displayResults;
                            scope.pageFunc('original');
                        }
                    },

                    cancelFilter: function() {
                        scope.filteredResults = scope.results;
                        scope.displayResults = scope.results;
                        scope.resultsCount = scope.displayResults.length;
                        if (scope.filterType === "Domain Name") {
                            scope.allResults = scope.displayResults;
                            scope.pageFunc('original');
                        }

                    }
                };

                scope.selectForm.selectedOption = scope.selectForm.options[0];
            }


            scope.addDetails = function(event, index, type) {
                var same, domains, num, newScope, currElem;
                currElem = angular.element(event.target);
                if (currElem.parent().parent().scope().hasData === true) {
                    delete currElem.parent().parent().scope().hasData;
                    currElem.parent().next().scope().$destroy();
                    currElem.parent().next().remove();
                } else {
                    currElem.parent().parent().scope().hasData = true;
                    newScope = scope.$new();
                    newScope.currentItem = currElem.scope().item;
                    if (scope.filterType !== 'Domain Name') {
                        domains = $compile('<div class="appended-data"><div class="domains-list"><div ng-repeat="domain in currentItem.Domains">{{domain}}</div></div></div>')(newScope);
                    } else if (scope.filterType === 'Domain Name') {
                        domains = $compile('<div class="appended-data"><div class="domain-info-list"><div ng-repeat="(key, val) in currentItem"><span ng-if="key !== filterType"><b>{{key}}:</b> {{val}}</span></div></div>')(newScope);
                    }

                    currElem.parent().parent().append(domains);
                }
            };



            scope.sortBy = function(sortType) {
                scope.sortType = sortType;
                scope.reverse = (scope.sortType === sortType) ? !scope.reverse : false;
            };
            scope.goToTop = function() {
                $location.hash('top');
                $anchorScroll();
            };

        },
        replace: true
    };

});
