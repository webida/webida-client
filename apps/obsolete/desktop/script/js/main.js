/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require(['common', 'underscore', 'async', 'toastr', 'md5', 'sly'], function (common, _, async, toastr) {
    'use strict';

    //var PROFILE_PATH = '/.userinfo';
    //var PROFILEJSON_PATH = PROFILE_PATH + '/profile.json';

    toastr.options = {
        'closeButton': true
    };

    common.getFS(function (data) {
        if (data) {
            _profile();
            _workspace();
            _app();
        } else {
            toastr.error('Please log in');
        }
    });

    function _profile() {
        var md5;
        var gravatar1;
        var gravatar2;
        var SIZE36 = '?s=36';
        var SIZE90 = '?s=90';
        var pfImg = $('.pf-img');
        var pfEditImg = $('.pf-info .image');
        var logout = $('.pf-info .info button');

        /* global webidaInfo:true */
        console.log('myInfo', webidaInfo); // webidaInfo is a gloval variable for user
        $('#pf-info-email').text(webidaInfo.email);
        $('#pf-email').val(webidaInfo.email);
        $('#pf-url').val(webidaInfo.url);
        $('#pf-company').val(webidaInfo.company);
        $('#pf-location').val(webidaInfo.location);
        $('#pf-name').val(webidaInfo.name);
        $('#pf-info-name').text(webidaInfo.name);

        if (webidaInfo.gravatar) {
            md5 = $.md5(webidaInfo.gravatar);
            gravatar1 = '<img src="https://secure.gravatar.com/avatar/' +
                md5 + SIZE36 + '&d=https://desktop.webida.org/resource/desktop_usericon2.png">';
            gravatar2 = '<img src="https://secure.gravatar.com/avatar/' +
                md5 + SIZE90 + '&d=https://desktop.webida.org/resource/desktop_usericon1.png">';
            $('#pf-gravatar-email').val(webidaInfo.gravatar);
        } else {
            gravatar1 = '<img src="resource/desktop_usericon2.png">';
            gravatar2 = '<img src="resource/desktop_usericon1.png" style="width:90px; height: 90px;">';
        }

        console.log('gravatar1', gravatar1);
        pfImg.append(gravatar1);
        pfEditImg.append(gravatar2);

        pfImg.click(function () {
            $('.pf-dlg').toggleClass('hide');
            $('.dimming').toggleClass('hide');
        });

        $('.dimming').click(function () {
            $('.dimming').toggleClass('hide');
            $('.pf-dlg').toggleClass('hide');
        });

        // make webidaAuth, webidaHost, webidaFs, webidaApp to global for jshintrc
        /* global webidaAuth, webidaHost, webidaFs:true */

        logout.click(function () {
            webidaAuth.logout(function (err) {
                if (err) {
                    alert('Failed to logout');
                } else {
                    location.href = '/';
                }
            });
        });
    }

    function _profileEdit() {
        var profileInfo = {
            email: $('#pf-email').val(), /* readonly */
            name: $('#pf-name').val(),
            url: $('#pf-url').val(),
            company: $('#pf-company').val(),
            location: $('#pf-location').val(),
            gravatar: $('#pf-gravatar-email').val()
        };

        webidaAuth.updateUser(profileInfo, function (err, userInfo) {
            if (!err) {
                toastr.success('Saved successfully');

                var md5;
                var SIZE36 = '?s=36';
                var SIZE90 = '?s=90';
                var pfImg = $('.pf-img img');
                var pfEditImg = $('.pf-info .image img');

                $('#pf-info-name').text(userInfo.name);

                md5 = $.md5(userInfo.gravatar);
                pfImg.attr('src', 'https://secure.gravatar.com/avatar/' +
                           md5 + SIZE36 + '&d=https://desktop.webida.org/resource/desktop_usericon2.png');
                pfEditImg.attr('src', 'https://secure.gravatar.com/avatar/' +
                               md5 + SIZE90 + '&d=https://desktop.webida.org/resource/desktop_usericon1.png');
            }
        });
    }

    function _workspace() {
        $('.container').removeClass('hide');
        var project = $('#project');
        var projectItem = $('#project-items');
        var wrap = project.parent();

        async.waterfall([
            function (next) {
                webidaFs.list('/', function (err, data) {
                    if (err) {
                        next(err);
                    } else {
                        var workspace = _.chain(data).filter(function (file) {
                            if (!file.name.match(/^\./) && file.isDirectory) {
                                return true;
                            }
                        }).value();

                        if (workspace.length) {
                            workspace.forEach(function (file) {
                                var item =
                                    '<li>' +
                                    '<div class="workspace-name" title="' +
                                    file.name + '" data-workspacename="' + file.name + '">' + file.name + '</div>' +
                                    '<div class="project-container">' +
                                    '<div class="project-name" data-project="' + file.name + '"></div>' +
                                    '<div class="project-count" data-count="'  + file.name + '"></div>' +
                                    '</div>' +
                                    '</li>';
                                projectItem.append(item);
                            });

                            // Call Sly on frame
                            project.sly({
                                horizontal: 1,
                                itemNav: 'forceCentered',
                                smart: 1,
                                activateMiddle: 1,
                                activateOn: 'click',
                                mouseDragging: 1,
                                touchDragging: 1,
                                releaseSwing: 1,
                                startAt: 0,
                                scrollBar: wrap.find('.scrollbar'),
                                scrollBy: 1,
                                speed: 300,
                                elasticBounds: 1,
                                easing: 'swing',
                                dragHandle: 1,
                                dynamicHandle: 1,
                                clickBar: 1,
                                prev: wrap.find('.prev'),
                                next: wrap.find('.next')
                            });

                            next(null, workspace);
                        } else {
                            var text =  'No workspace';
                            projectItem.append(text).css({
                                'text-align': 'center',
                                'font-weight': 'bold',
                                'color': '#bbcfe5'
                            });
                            next(null, workspace);
                        }
                    }
                });
            },
            function (workspace, next) {
                if (!workspace.length) {
                    next();
                }

                _.chain(workspace).each(function (project) {
                    webidaFs.list(project.name, function (err, data) {
                        if (err) {
                            next(err);
                        } else {
                            var projectNode = $('.project-name[data-project="' + project.name + '"]');
                            var countNode = $('.project-count[data-count="' + project.name + '"]');
                            var projectlist = _.chain(data).filter(function (file) {
                                if (!file.name.match('.workspace') && file.isDirectory) {
                                    return true;
                                }
                            }).value();

                            var projectLen = projectlist.length;
                            countNode.text(projectLen);

                            if (projectLen) {
                                projectlist.forEach(function (project, idx) {
                                    if (idx <= 4) {
                                        projectNode.append('<div class="project-nameitem" title="' +
                                                           project.name + '">' + project.name + '</div>');
                                    }
                                    else if (idx === 5) {
                                        projectNode.append('<div class="project-nameitem">...</div>');
                                    }
                                });
                            } else {
                                projectNode.append('<div class="project-nameitem">No Project</div>');
                            }
                        }
                    });
                });

                next();
            }
        ], function (err) {
            if (!err) {
                $('.workspace-name').click(function () {
                    var self = $(this);
                    var workspace = '?workspace=' + webidaFs.fsid + '/' + self.attr('data-workspacename');
                    // webidaApp.launchApp('devenv', true, workspace);
                    window.open('../ide/src/index.html' + workspace);
                });
            } else {
                console.log(err);
            }
        });
    }

    function _app() {
        var app = $('#app-items');
        app.append('<li class="dashboard" data-appid="dashboard"><div>Development Center</div></li>');
        // app.append('<li class="document" data-appid="wikida"><div>Document</div></li>');
        app.append('<li class="settings" data-toggle="modal" data-target="#account-dlg"><div>Settings</div></li>');

        $('#app-items li').click(function () {
            var self = $(this);
            var appid = self.attr('data-appid');
            // if (appid) {
            //     webidaApp.launchApp(appid, true);
            // }
            if (appid === 'dashboard') {
                window.open('../dashboard/');
            }
        });

        $('#pf-confirm').click(function (evt) {
            evt.preventDefault();
            _profileEdit();
        });

        $('#account-dlg').on('show.bs.modal', function () {
            $('#setting-tab a:first').tab('show');

            // Should call getMyInfo to reflect updated information
            webidaAuth.getMyInfo(function (err, userInfo) {
                if (err) {
                    toastr.error(err);
                } else {
                    $('#pf-url').val(userInfo.url);
                    $('#pf-company').val(userInfo.company);
                    $('#pf-location').val(userInfo.location);
                    $('#pf-name').val(userInfo.name);
                    $('#pf-email').val(userInfo.email);
                }
            });

            $('#account-old-pw').val('');
            $('#account-new-pw').val('');
            $('#account-confirm-pw').val('');
            $('#account-delete').val('');
        });

        $('#account-update-btn').click(function (evt) {
            evt.preventDefault();

            var oldPW = $('#account-old-pw');
            var newPW = $('#account-new-pw');
            var confirmPW = $('#account-confirm-pw');

            if (newPW.val().length < 6) {
                toastr.warning('Minimum length of a password is 6');
            }
            else if (newPW.val() !== confirmPW.val()) {
                toastr.warning('The passwords do not match');
            }
            else {
                webidaAuth.changeMyPassword(oldPW.val(), newPW.val(), function (err) {
                    if (err) {
                        toastr.warning(err);
                        oldPW.val('');
                        newPW.val('');
                        confirmPW.val('');
                    } else {
                        oldPW.val('');
                        newPW.val('');
                        confirmPW.val('');
                        toastr.success('Changed successfully');
                    }
                });
            }
        });

        $('#account-del-btn').click(function (evt) {
            evt.preventDefault();

            var accountInfo = $('#account-delete');
            if (accountInfo.val() === '') {
                toastr.warning('Enter your email address');
            }
            else if (webidaInfo.email !== accountInfo.val()) {
                toastr.warning('The email address is not correct');
            }
            else if (webidaInfo.email === accountInfo.val()) {
                webidaAuth.deleteMyAccount(function (err) {
                    if (!err) {
                        toastr.success('Deleted your account successfully');
                        location.href = '//' + webidaHost;
                    }
                });
            }
            else {
                toastr.error('Unknown error');
            }
        });
    }
});
