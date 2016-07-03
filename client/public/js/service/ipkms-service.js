angular.module('ipkmsService', [])
    .service('apiService', function ($http) {
        this.get = function (apiURL) {
            var request = {
                url: apiURL,
                method: "GET"
            };
            return $http(request).then(function (response) {
                return response
            })
        };

        this.delete = function (apiURL, data) {
            var request = {
                url: apiURL,
                method: "DELETE",
                data: data,
                headers: {'Content-Type': 'application/json'}
            };
            return $http(request).then(function (response) {
                return response
            })
        };

        this.deleteWithParams = function (apiURL, data) {
            var request = {
                url: apiURL,
                method: "DELETE",
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };
            return $http(request).then(function (response) {
                return response
            })
        };

        this.post = function (apiURL, data) {
            var request = {
                url: apiURL,
                method: "POST",
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };
            return $http(request).then(function (response) {
                return response
            })
        };

        this.postJSON = function (apiURL, data) {
            var request = {
                url: apiURL,
                method: "POST",
                data: data,
                headers: {'Content-Type': 'application/json'}
            };
            return $http(request).then(function (response) {
                return response
            })
        };

        this.put = function (apiURL, data) {
            var request = {
                url: apiURL,
                method: "PUT",
                data: data,
                headers: {'Content-Type': 'application/json'}
            };
            return $http(request).then(function (response) {
                return response
            })
        }

    })
    .service('subjectsService', function () {
        this.subjects = [
            {name: "數學", id: "math"},
            {name: "英文", id: "eng"},
            {name: "中文", id: "chi"},
            {name: "通識", id: "ls"}, //ls stand for liberal studies
            {name: "班務", id: "cf"} //cf stand for class affair
        ];
        this.idToName = function (id) {
            var array = this.subjects;
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === id) {
                    return array[i].name;
                }
            }
        }
    })
    .service('homeworkService', function () {
        this.deliveryBooleanToText = function (boolean) {
            if (boolean == true) {
                return "已布置"
            } else {
                return "未布置"
            }
        }
    })
    .service('generalService', function () {
        this.idToDate = function (id) {
            var timestamp;
            var date;
            if (id) {
                timestamp = id.toString().substring(0, 8);
                date = new Date(parseInt(timestamp, 16) * 1000);
                return date
            } else {
                return " "
            }
        };

        this.roleToName = function (role) {
            switch (role) {
                case 'student':
                    return '學生';
                    break;
                case 'parent':
                    return '家長';
                    break;
                case 'manager':
                    return '行政賬號';
                    break;
                case 'teacher':
                    return '教師';
                    break;
                case 'admin':
                    return '管理員';
                    break;
                default:
                    return '普通用戶'
            }
        };

        this.tagsArrayToString = function (tagsArray) {
            var aL = tagsArray.length;
            var values = "";
            for (i = 0; i < aL; i++) {
                values = values + " " + tagsArray[i]
            }
            return values
        }
    });