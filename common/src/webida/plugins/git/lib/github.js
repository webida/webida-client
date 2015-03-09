// Github.js 0.8.0
// (c) 2013 Michael Aufreiter, Development Seed
// Github.js is freely distributable under the MIT license.
// For all details and documentation:
// http://substance.io/michael/github

define(function () {
    var API_URL = 'https://api.github.com';
    
    var Github = function(token) {
        
        // HTTP Request Abstraction
        // =======
        // 
        // I'm not proud of this and neither should you be if you were responsible for the XMLHttpRequest spec.
        
        function _request(method, path, data, cb, raw) {
            function getURL() {
                var url = API_URL + path;
                return url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
            }
            
            var xhr = new XMLHttpRequest();
            if (!raw) {xhr.dataType = "json";}
            
            xhr.open(method, getURL());
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status >= 200 && this.status < 300 || this.status === 304) {
                        cb(null, raw ? this.responseText : this.responseText ? JSON.parse(this.responseText) : true);
                    } else {
                        cb({request: this, error: this.status});
                    }
                }
            };
            xhr.setRequestHeader('Accept', 'application/vnd.github.raw');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', 'token ' + token);
            
            data ? xhr.send(JSON.stringify(data)) : xhr.send();
        }
        
        Github.User = function() {
            this.repos = function(cb) {
                _request("GET", "/user/repos?type=all&per_page=1000&sort=updated", null, function(err, res) {
                    cb(err, res);
                });
            };
        };        
        
        Github.Repository = function() {
            this.create = function(options, cb) {
                _request("POST", "/user/repos", options, cb);
            };
        };
        
        // Top Level API
        // -------
        
        this.getRepo = function() {
            return new Github.Repository();
        };
        
        this.getUser = function() {
            return new Github.User();
        };
    };
    
    return Github;
});
