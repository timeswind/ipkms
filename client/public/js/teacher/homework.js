angular.module('ipkms.teacherManageHomework', ['ipkmsMain', 'ipkmsService', 'ui.tinymce'])

    .controller('HomeworksManageController', function ($rootScope, $scope, $http, $mdDialog, $mdMedia, apiService, homeworkService, generalService) {
        getMyThomeworks();
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $scope.showNewHomeworkForm = function (ev) {
            $mdDialog.show({
                templateUrl: '/html/newhomeworkform.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                controllerAs: 'ctrl',
                controller: "NewHWDialogController"
            }).then(function (results) {
                if (results == "success") {
                    getMyThomeworks();
                }
            }, function () {
                // console.log('You cancelled the dialog.');
            });

        };
        $scope.showThomeworkDialog = function (ev, t) {
            $scope.thomework = t;
            $mdDialog.show({
                templateUrl: '/html/thomework-modal.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    thomework: $scope.thomework
                },
                controller: "ThomeworkModalController"
            }).then(function (results) {
                if (results == "success") {
                    getMyThomeworks();
                }
            }, function () {
                // console.log('You cancelled the dialog.');
            });

        };

        $scope.bTd = function (boolean) {
            return homeworkService.deliveryBooleanToText(boolean)
        };

        $scope.idToDate = function (id) {
            return generalService.idToDate(id)
        };

        var doneGrabingGroupsDataTimer;

        function getMyThomeworks() {
            $scope.grabingGroupsData = true;
            clearTimeout(doneGrabingGroupsDataTimer);
            apiService.get("/api/manage-homework/teacher/homeworks").then(
                function (response) {
                    $scope.MyThomeworks = response.data;
                    doneGrabingGroupsDataTimer = setTimeout(doneGrabingGroupsData, 1500);
                },
                function (response) { // optional
                    console.log("fail to get thomework" + response)
                })
        }

        function doneGrabingGroupsData() {
            $scope.grabingGroupsData = false;
            $scope.$apply();
        }

        $scope.arrayToString = function (array) {
            return generalService.tagsArrayToString(array)
        };

        $scope.predicate = 'none';
        $scope.reverse = false;
        $scope.order = function (predicate) {
            $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
            $scope.predicate = predicate;
        };

        $scope.deleteThomework = function (id) {
            var data = {
                thomework_id: id
            }
            var apiURL = '/api/manage-homework/teacher/homeworks'
            apiService.delete(apiURL, data).then(function (response) {
                    getMyThomeworks();
                },
                function (response) { // optional
                    console.log("fail to delete this thomework")
                });
        }


    })

    .controller('NewHWDialogController', function ($rootScope, $scope, $http, $mdDialog, $mdMedia, apiService, subjectsService) {
        $scope.subjects = subjectsService.subjects

        $scope.groupsClasses = null;
        $scope.newhomework = {
            delivery: "false",
            tags: []
        };

        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.tinymceOptions = {
            language: 'zh_TW',
            menubar: false,
            statusbar: false,
            toolbar: 'undo redo | bold italic | bullist numlist',
            content_css: '/css/editor-content.css'
        };

        $scope.loadMyGroups = function () {

            apiService.get("/api/manage-group/teacher/groups").then(
                function (response) {
                    var reformatedResponse = response.data.map(function (obj) {
                        var robj = {};
                        robj["category"] = 'group';
                        robj["name"] = obj.name;
                        robj["id"] = obj._id;

                        return robj;
                    });
                    return $scope.groupsClasses = reformatedResponse
                },
                function (response) { // optional
                    console.log("fail to get mygroups" + response)
                })
        };

        $scope.createHomework = function () {
            var data = {
                title: $scope.newhomework.title,
                delivery: $scope.newhomework.delivery,
                requirement: $scope.newhomework.requirement,
                subject: $scope.newhomework.subject,
                tags: $scope.newhomework.tags,
                targetGroup: $scope.newhomework.targetGroup,
                deadline: $scope.newhomework.deadline
            };
            apiService.postJSON("/api/manage-homework/teacher/homeworks", data).then(function (response) {
                    // success
                    $mdDialog.hide("success");
                },
                function (response) {
                    // failed
                    console.log("create Homework fail")

                });
        }

    })

    .controller('ThomeworkModalController', function ($scope, $http, $sce, $mdDialog, $mdMedia, thomework, apiService, subjectsService, homeworkService) {
        getThomeworkDetails();
        thomework.subjectText = subjectsService.idToName(thomework.subject);
        thomework.deliveryText = homeworkService.deliveryBooleanToText(thomework.delivery);
        $scope.thomework = thomework;
        $scope.hide = function () {
            $mdDialog.hide()
        };

        $scope.cancel = function () {
            $mdDialog.cancel()
        };

        $scope.tinymceOptions = {
            language: 'zh_TW',
            menubar: false,
            statusbar: false,
            toolbar: 'undo redo | bold italic | bullist numlist',
            content_css: '/css/editor-content.css'
        };

        function getThomeworkDetails() {
            var apiURL = '/api/manage-homework/teacher/homework/' + thomework._id;
            apiService.get(apiURL).then(function (response) {
                    $scope.thomeworkDetails = response.data;
                    $scope.requirementHtml = $sce.trustAsHtml(response.data.requirement);
                    $scope.editableRequirement = response.data.requirement;
                },
                function (response) { // optional
                    console.log("fail to get homework's details" + response.data)
                });

        }

        $scope.loadMyGroups = function () {

            apiService.get("/api/manage-group/teacher/groups").then(
                function (response) {
                    var reformatedResponse = response.data.map(function (obj) {
                        var robj = {};
                        robj["category"] = 'group';
                        robj["name"] = obj.name;
                        robj["id"] = obj._id;

                        return robj;
                    });

                    return $scope.groupsClasses = reformatedResponse
                },
                function (response) { // optional
                    console.log("fail to get my groups" + response)
                })
        };

        $scope.publishSavedHomework = function () {
            var publishHomeworkData = {
                targetGroup: $scope.publishhomework.targetGroup,
                deadline: $scope.publishhomework.deadline
            };

            var apiURL = "/api/update/teacher/thomework/" + thomework._id + "/publish";
            apiService.put(apiURL, publishHomeworkData).then(
                function (response) {
                    $mdDialog.hide("success")
                },
                function (response) { // optional
                    console.log("fail to publish thomework" + response)
                });

            console.log(publishHomeworkData);
        };

        $scope.updateRequirement = function () {
            var apiURL = "/api/update/teacher/thomework/" + thomework._id + "/requirement";
            apiService.put(apiURL, $scope.editableRequirement).then(
                function (response) {
                    getThomeworkDetails();
                    $scope.editRequirement = false;
                },
                function (response) { // optional
                    console.log("fail to update thomework requirement" + response)
                })
        };

        $scope.updateTags = function () {
            var apiURL = "/api/update/teacher/thomework/" + thomework._id + "/tags";
            apiService.put(apiURL, $scope.thomework.tags).then(
                function (response) {
                    getThomeworkDetails();
                    $scope.editTags = false;
                },
                function (response) {
                    console.log("fail to update thomework tags")
                })
        };

    });
