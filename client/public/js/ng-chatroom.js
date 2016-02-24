angular.module('ipkms')
.controller('chatroomController', function($scope, $http, $window, apiService, socket) {
  var userToken = $window.sessionStorage.token;

  $scope.authentication = false;
  $scope.ifGetGroupList = false;

  //chatrooms global
  $scope.myId = "";
  $scope.myGroups = [];
  $scope.messages = [];
  $scope.onlineUsers = [];

  //chatroom
  $scope.roomId = "";

  socket.on('connect', function () {
    socket.emit('authenticate', {token: userToken});
  });

  socket.on('authenticated', function () {
    $scope.authentication = true;

    if(!$scope.ifGetGroupList) {
      getMyGroupsList();
    }
  })

  socket.on("user joined", function(user) {

    $scope.onlineUsers[$scope.roomId].push(user);

  });

  socket.on("emit message", function(data) {

    var incomeMsg = {
      userid : data.userid,
      username : data.username,
      contents : data.text
    }

    $scope.messages[$scope.roomId].push(incomeMsg);
    updateScroll()

  });

  $scope.selectRooom = function(id) {
    $scope.roomId = id
    $scope.messages[id] = [];
    $scope.onlineUsers[id] = [];
    catchup(id);
    joinRoom(id);
  }

  $scope.sendMessage = function(){
    sendMessage();
  }

  $scope.listenForEnter = function(keyEvent) {
    if (keyEvent.which === 13) {
      sendMessage();
    }
  }

  $scope.selfMessage = function(userid) {
    if (userid === $scope.myId) {
      return true;
    } else {
      return false;
    }
  }

  function sendMessage(){
    if ($scope.authentication) {
      if ($scope.msg.content) {
        var newMsg = {text: $scope.msg.content, roomId: $scope.roomId};
        socket.emit("new message", newMsg);
        $scope.msg.content = ""
      }
    }
  }

  function getMyGroupsList() {
    apiService.get('/api/myinfo').then(function(response) {
      $scope.myId = response.data.id;
      if (response.data.role === "student") {
        apiService.get('/api/studentgroups').then(function(response) {
          $scope.ifGetGroupList = true;
          $scope.myGroups = response.data;
          console.log("student")
          $scope.roomId = "56b1db6890eea6b508ebe681";

          $scope.messages[$scope.roomId] = [];
          $scope.onlineUsers[$scope.roomId] = [];
          catchup($scope.roomId);


          joinRoom($scope.roomId);
        });
      } else if (response.data.role === "teacher") {
        apiService.get('/api/teacher/groups/simple').then(function(response) {
          $scope.ifGetGroupList = true;
          $scope.myGroups = response.data.teachGroups;
          $scope.roomId = $scope.myGroups[0]["group"]["_id"]

          $scope.messages[$scope.roomId] = [];
          $scope.onlineUsers[$scope.roomId] = [];
          catchup($scope.roomId);


          joinRoom($scope.roomId);
        });
      }
    });
  }

  function catchup(roomId) {
    var apiURL = '/api/message/catchup/' + roomId;
    apiService.get(apiURL).then(function(response) {

      for(i=0;i<response.data.length;i++){
        var incomeMsg = {
          userid : response.data[i]["sender"]["_id"],
          username : response.data[i]["sender"]["local"]["name"],
          contents : response.data[i]["content"]
        }
        $scope.messages[$scope.roomId].push(incomeMsg);
      }
    });
  }

  function joinRoom(id){
    if ($scope.authentication) {
      socket.emit('new user', {
        roomId: id
      });
    } else {
      console.log('you are not authenticated');
    }
  }

  function updateScroll(){
    var element = document.getElementById("messageBox");
    element.scrollTop = element.scrollHeight;
  }

})
