app.service('DataService', function($http) {
    this.getData = function(type, callback) {
            var url = (type === "federal") ? 'fed.json' : 'nofed-statesonly.json';
            $http.get('data/' + url).then(callback);
    };
});
