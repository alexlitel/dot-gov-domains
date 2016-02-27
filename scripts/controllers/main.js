app.controller('mainCtrl', function($scope, $compile, DataService) {
    $scope.getItems = function(type) {
        $scope.select = type;
        $scope.active = true;
        $scope.optionType = (type === 'federal') ? 'agency' : 'state';
        $scope.filterType = null;
        $scope.radioVal = null;
        $scope.matchedItems = null;
        $scope.searchVal = '';
        if ($scope.results) {
            $scope.results = null;
            angular.element(document.querySelector('.results-wrapper')).scope().$destroy();
            angular.element(document.querySelector('.results-wrapper')).remove();
        }

        $scope.data = DataService.getData(type);

    };

    $scope.emptyList = function(num) {
        $scope.dropDownSel = $scope.matchedItems[num];
        $scope.activeSearch = false;
        $scope.searchVal = $scope.dropDownSel;
        $scope.matchedItems = null;

    };

    $scope.blurEvent = function(event) {
        if (!angular.element(event.relatedTarget).hasClass('auto-list-item')) {
          $scope.activeSearch = false;
        } 
    };


    $scope.changeFunc = function() {
        if ($scope.matchedItems) {
            $scope.matchedItems = null;
        }
        if ($scope.results) {
            $scope.results = null;
            angular.element(document.querySelector('.results-wrapper')).scope().$destroy();
            angular.element(document.querySelector('.results-wrapper')).remove();
        }
        $scope.searchVal = '';
        $scope.activeSearch = false;
        $scope.filterType = ($scope.radioVal === $scope.optionType) ? ($scope.select === 'federal') ? 'Agency' : 'State' : 'Domain Name';
        $scope.filteredItems = $scope.data.map(function(item) {
            return item[$scope.filterType];
        }).filter(function(item, i, arr) {
            return arr.indexOf(item) === i;
        }).sort(function(a, b) {
            return a.localeCompare(b);
        });

    };

    $scope.autoCompleteItems = function() {
        $scope.matchedItems = $scope.filteredItems.filter(function(i) {
            return i.toLowerCase().indexOf($scope.searchVal.toLowerCase()) !== -1;
        });

    };

    $scope.aboutModal = function() {
        if (angular.element(document.querySelector('.about-container')).length === 0) {
            angular.element(document.querySelector('.container')).append($compile('<about></about>')($scope));
        }
    };

    $scope.getResults = function(type) {
        var rFilter = $scope.filterType;
        if (!$scope.radioVal && type !== null) {
            alert("Please select a search type.");
            return false;
        }
        if (type === 'search' && !$scope.searchVal) {
            alert("Please type a search value.");
            return false;
        }
        $scope.results = (type === 'all') ? $scope.data : $scope.data.filter(function(item, i) {
            return item[rFilter].toLowerCase() === $scope.searchVal.toLowerCase();
        });

        if (rFilter !== 'Domain Name') {
            $scope.results = $scope.results.reduce(function(arr, currentValue) {
                var index = false;

                arr.forEach(function(item, i) {
                    if (item[rFilter] === currentValue[rFilter]) {
                        index = i;
                    }
                });

                if (index === false) {
                    if (rFilter === "Agency") {
                        arr.push({
                            "Agency": currentValue.Agency,
                            "Domains": [currentValue["Domain Name"]]
                        });
                    } else if (rFilter === "State") {
                        arr.push({
                            "State": currentValue.State,
                            "Domains": [currentValue["Domain Name"]]
                        });
                    }
                    return arr;
                }

                arr[index].Domains.push(currentValue["Domain Name"]);
                arr.sort(function(a, b) {
                    return a[rFilter].localeCompare(b[rFilter]);
                });
                return arr;
            }, []);
            $scope.results.forEach(function(item) {
                item.Domains = item.Domains.sort(function(a, b) {
                    return a.localeCompare(b);
                });
                item["Domain Count"] = item.Domains.length;
                item.Percentage = +((item["Domain Count"] / $scope.data.length) * 100).toFixed(2);
            });
        }
        if (rFilter === 'Domain Name') {
            $scope.results.sort(function(a, b) {
                return a[rFilter].localeCompare(b[rFilter]);
            });
        }

        $scope.results = ($scope.results.length > 1) ? $scope.results : $scope.results[0];


        if (angular.element(document.querySelector('.results-wrapper')).length === 1) {
            angular.element(document.querySelector('.results-wrapper')).scope().$destroy();
            angular.element(document.querySelector('.results-wrapper')).remove();
        }

        angular.element(document.querySelector('.container')).append($compile('<results></results>')($scope.$new()));
    };


});
