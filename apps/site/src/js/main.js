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

define([
    'webida-lib/app-config',
    'webida',
    'toastr'
], function (AppConfig, Webida, toastr) {
    'use strict';

    toastr.options = {
        closeButton: true,
        debug: false,
        positionClass: 'toast-top-right',
        onclick: null,
        showDuration: 300,
        hideDuration: 300,
        timeOut: 3000,
        extendedTimeOut: 1000,
        showEasing: 'swing',
        hideEasing: 'swing',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut'
    };

    function getRedirectUrl() {
        /* global URI:true */
        var cur = new URI(location.href);
        var authRel = new URI('auth.html');
        var redirectUrl = authRel.absoluteTo(cur);
        redirectUrl.query('');
        return redirectUrl.toString();
    }

    function openDesktop() {
        // Webida.app.launchApp('desktop', true, null, {name: 'desktop'});
				window.open('../desktop/', 'desktop', '');
    }

    Webida.auth.initAuth(AppConfig.clientId, AppConfig.redirectUrl);

    $(document).ready(function () {
        //var emailSendBtn = $('.email_send');
        var notiOK = $('.noti_ok');

        Webida.auth.getLoginStatus(function (err, user) {
            if (err || !user) {
                console.log(err, user);

                $('.not-logged-in').fadeIn(400).removeClass('hidden');
                $('.logged-in').hide();

            } else {
                // location.replace('//desktop.' + Webida.conf.webidaHost);
				location.replace('../desktop/');
            }
        });

        $('button.desktop').click(function () {
            openDesktop();
        });

        $('button.login').click(function () {
            //var reUrl = getRedirectUrl();
            var url = Webida.conf.authApiBaseUrl + '/authorize?response_type=token' +
                '&redirect_uri=' + encodeURIComponent(AppConfig.redirectUrl) +
                '&client_id=' + AppConfig.clientId +
                '&skip_decision=false&type=web_server&state=site';

            location.href = url;
        });

        $('button.logout').click(function () {
            Webida.auth.logout(function (err) {
                if (err) {
                    alert('Failed to logout');
                } else {
                    location.reload();
                }
            });
        });

        $(document).on('click', 'button.signup', function () {
            var self = $(this);
            var dialog = $('.profile-dialog');
            var dimming = $('.dimming');

            if (dialog.is(':visible')) {
                dialog.fadeOut(100);
                dimming.fadeOut(100);
            } else {
                dialog.fadeIn(100).removeClass('hidden');
                dimming.fadeIn(100).removeClass('hidden');

                var offset = self.offset();
                var endLeft = offset.left + self.outerWidth();

                if (offset.left + dialog.outerWidth() > $(window).width()) {
                    offset.left += endLeft - (offset.left + dialog.outerWidth());
                    dialog.find('.profile-arrow').css('margin-left', '300px');
                } else {
                    dialog.find('.profile-arrow').css('margin-left', '30px');
                }

                offset.top += parseInt(self.outerHeight(), 10);

                dialog.offset(offset);
                dialog.find('.signup-input').focus();
            }
        });

        $('.dimming').click(function () {
            $('.profile-dialog').fadeOut(100);
            $('.dimming').fadeOut(100);
        });

        $('.block-dimming').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
        });

        $('.profile-dialog input').keydown(function (e) {
            if (e.keyCode === 13) {
                $('.profile-dialog button.submit').trigger('click');
                e.preventDefault();
                e.stopPropagation();
            }
        });

        $('.profile-dialog button.submit').click(function () {
            var email = document.getElementById('email').value;
            if (!email) {
                toastr.warning('Email address must be filled.');
                return false;
            }

            Webida.auth.signup(email, function (err, data) {
                if (err) {
                    //var e = JSON.parse(err);
                    console.log('signup failed', err);

                    if (err === 'Email is already used') {
                        toastr.error('"' + email + '" is already used!');
                        $('#email').focus();
                    }
                    else if (err === 'Signup is forbidden') {
                        toastr.error('Sorry, but signing up is currently blocked by the administrator.');
                    }
                    else {
                        toastr.error('Unknown error occurred! Please try again later');
                    }
                } else {
                    console.log('signup success', data);

                    $('.profile-dialog').fadeOut(100);
                    $('.dimming').fadeOut(100);
                    $('.block-dimming').fadeIn(100).removeClass('hidden');

                    var dialog = $('.email-sent-dialog').fadeIn(100).removeClass('hidden');
                    var top = ($(window).height() - dialog.outerHeight()) / 2;
                    var left = ($(window).width() - dialog.outerWidth()) / 2;

                    dialog.css({
                        left: left > 0 ? left : 0,
                        top: top > 0 ? top : 0
                    });

                    dialog.find('button').click(function () {
                        dialog.fadeOut(100);
                        $('.block-dimming').fadeOut(100);
                    });
                }
            });
        });

        notiOK.click(function () {
            $('.dimming').toggleClass('hide');
            $('.container').toggleClass('hide');
        });
    });
});
