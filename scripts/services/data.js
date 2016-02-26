app.service('DataService', function($http) {
    this.getData = function(type) {
        if (sessionStorage.getItem(type) === null) {
            var url = (type === "federal") ? 'fed.json' : 'nofed-statesonly.json';
            $http.get('data/' + url).then(function(response) {
                sessionStorage.setItem(type, JSON.stringify(response.data));
                return response.data;
            });
        } else {
            return JSON.parse(sessionStorage.getItem(type));
        }
    };
});
