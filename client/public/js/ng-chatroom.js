angular.module('ipkms.chatroom', ['ipkmsMain', 'ipkmsService'])
    .controller('ChatroomController', function ($scope, $http, $window, $mdSidenav, apiService, socket) {
        var userToken = $window.sessionStorage.token;
        $scope.authentication = false;
        $scope.ifGetGroupList = false;

        //chatrooms global
        $scope.myId = null;
        $scope.myGroups = {};
        $scope.historyMessages = {};
        $scope.messages = {};
        $scope.unreadCount = {};
        $scope.unreadLine = {};
        $scope.onlineUsers = {};

        //chatroom
        $scope.roomName = null;
        $scope.roomId = null;

        socket.on('connect', function () {
            socket.emit('authenticate', {token: userToken});
        });


        socket.on('authenticated', function () {
            $scope.authentication = true;

            if (!$scope.ifGetGroupList) {
                getMyGroupsList();
            }
        });

        socket.on("user joined", function (user) {
            $scope.onlineUsers[$scope.roomId] = [];
            $scope.onlineUsers[$scope.roomId].push(user);

        });

        socket.on("emit message", function (data) {
            var incomeMsg = {
                userid: data.userid,
                username: data.username,
                contents: data.text,
                nameColor: data.nameColor,
                date: data.date
            };

            $scope.messages[data.roomId].push(incomeMsg);
            if (data.roomId === $scope.roomId) {
                updateScroll()
            } else {

                if ($scope.unreadCount[data.roomId]) {
                    $scope.unreadCount[data.roomId]++
                } else {
                    $scope.unreadCount[data.roomId] = 0;
                    $scope.unreadCount[data.roomId]++
                }
            }

        });

        $scope.selectRoom = function (name, id) {
            $scope.roomName = name;
            $scope.roomId = id;

            if ($scope.unreadCount[id]) {
                $scope.unreadLine[id] = [];
                $scope.unreadLine[id] = $scope.messages[id].length - $scope.unreadCount[id];
                $scope.unreadCount[id] = 0;
            }

            setTimeout(function () {
                $scope.isSidenavOpen = false;
                updateScroll()
            }, 0);
        };

        $scope.sendMessage = function () {
            sendMessage();
        };

        $scope.listenForEnter = function (keyEvent) {
            if (keyEvent.which === 13) {
                sendMessage();
            }
        };

        $scope.selfMessage = function (userid) {
            return userid === $scope.myId;
        };

        function sendMessage() {
            if ($scope.authentication) {
                if ($scope.msg.content) {
                    var newMsg = {text: $scope.msg.content, roomId: $scope.roomId};
                    socket.emit("new message", newMsg);
                    $scope.msg.content = ""
                }
            }
        }

        function getMyGroupsList() {
            apiService.get('/api/myinfo').then(function (response) {
                $scope.myId = response.data.id;
                if (response.data.role === "student") {
                    apiService.get('/api/studentgroups').then(function (response) {
                        $scope.ifGetGroupList = true;
                        $scope.myGroups = response.data;
                        $scope.roomName = $scope.myGroups[0]["name"];
                        $scope.roomId = $scope.myGroups[0]["_id"];

                        for (var i = 0; i < $scope.myGroups.length; i++) {
                            joinRoom($scope.myGroups[i]["_id"]);
                        }
                    });
                } else if (response.data.role === "teacher") {
                    apiService.get('/api/manage-group/teacher/groups').then(function (response) {
                        $scope.ifGetGroupList = true;
                        $scope.myGroups = response.data;
                        $scope.roomName = $scope.myGroups[0]["name"];
                        $scope.roomId = $scope.myGroups[0]["_id"];

                        for (var i = 0; i < $scope.myGroups.length; i++) {
                            joinRoom($scope.myGroups[i]["_id"]);
                        }
                    });
                }
            });
        }

        function catchup(roomId) {
            var apiURL = '/api/message/catchup/' + roomId;
            apiService.get(apiURL).then(function (response) {
                // console.log(response.data)
                $scope.messages[roomId] = [];
                $scope.historyMessages[roomId] = [];

                for (var i = 0; i < response.data.length; i++) {
                    var incomeMsg = {
                        userid: response.data[i]["sender"]["_id"],
                        username: response.data[i]["sender"]["local"]["name"],
                        contents: response.data[i]["content"],
                        date: response.data[i]["date"]
                    };
                    $scope.historyMessages[roomId].push(incomeMsg);
                }
            });
        }

        function joinRoom(id) {
            if ($scope.authentication) {
                socket.emit('new user', {
                    roomId: id
                });
                catchup(id);
            } else {
                console.log('you are not authenticated');
            }
        }

        function updateScroll() {
            var element = document.getElementById("scrollBox");
            element.scrollTop = element.scrollHeight;
        }

        //nav
        $scope.toggleLeftNav = buildToggler('left');

        function buildToggler(navID) {
            return function () {
                $mdSidenav(navID)
                    .toggle()
            }
        }

    });
