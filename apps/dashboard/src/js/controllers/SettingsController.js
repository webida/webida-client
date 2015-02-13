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
    'lodash',
    'moment',
    'services/SettingsManager',
    'toastr',
    'q'
], function (_, moment, SettingsManager, toastr, Q) {
    'use strict';
    var SettingsController = function () {};

    $.extend(SettingsController.prototype, {

        execute: function () {
            var _this = this;

            $('.section > div').hide();
            $('#area-settings').fadeIn(100);

            $('button.generate-key').off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                _this.generatePublicSSHKey();
            });

            $('button.save-token').off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                _this.saveGitHubToken();
            });

            _this.showPublicSSHKey();
            _this.showGitHubToken();
            _this.showPersonalTokens();

            $('.add-token-button').on('click', function () {
                _this.addNewPersonalToken();
            });
        },

        showPublicSSHKey: function () {
            SettingsManager.getPublicSSHKey().then(function (key) {
                $('#public-ssh-key').val(key);
            });
        },

        generatePublicSSHKey: function () {
            var _this = this;

            SettingsManager.getPublicSSHKey().then(function () {
                var dialog = $('#generate-confirm-dialog');
                var overlay = $('.overlay');

                dialog.fadeIn(100);
                overlay.fadeIn(100);

                var closeButton = dialog.find('.dialog-close');

                closeButton.off('click').on('click', function () {
                    overlay.fadeOut(100);
                    dialog.fadeOut(100);
                });

                dialog.find('.yes').off('click').on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    closeButton.trigger('click');

                    SettingsManager.removePublicSSHKey()
                    .then(_generatePublicSSHKey)
                    .then(function () {
                        toastr.success('Successfully generated a new key');
                        _this.showPublicSSHKey();

                    }).fail(function () {
                        toastr.error('Could not generate a new key');
                    });
                });

                dialog.find('.no').off('click').on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    closeButton.trigger('click');
                });

            }).fail(function () {
                _generatePublicSSHKey().then(function () {
                    toastr.success('Successfully generated a new key');
                    _this.showPublicSSHKey();

                }).fail(function () {
                    toastr.error('Could not generate a new key');
                });
            });

            function _generatePublicSSHKey() {
                var defer = Q.defer();

                SettingsManager.generatePublicSSHKey()
                .then(function () {
                    defer.resolve();

                }).fail(function (e) {
                    defer.reject(e);
                });

                return defer.promise;
            }
        },

        showGitHubToken: function () {
            SettingsManager.getGitHubToken().then(function (token) {
                token = JSON.parse(token);

                $('#github-token').val(token.tokenKey);
            });
        },

        saveGitHubToken: function () {
            var token = $('#github-token').val();

            SettingsManager.setGitHubToken(token).then(function () {
                toastr.success('Successfully saved the GitHub Token');

            }).fail(function () {
                toastr.error('Could not save the GitHub token!');
            });
        },

        showPersonalTokens: function () {
            var _this = this;
            var defer = Q.defer();
            var body = $('#personal-token-list').html('');
            var loading = $('<div class="row info">Loading Personal Tokens...</div>');
            body.append(loading);
            SettingsManager.getPersonalTokens().then(function (personalTokens) {
                loading.remove();
                if (!personalTokens || personalTokens.length === 0) {
                    var notoken = $('<div class="row info">There are no personal tokens.</div>');
                    body.append(notoken);
                    defer.resolve();
                    return;
                }
                _.forEach(personalTokens, function (token) {
                    _this.addPersonalTokenRow(token);
                });
                defer.resolve();
            }).fail(function () {
                toastr.error('Could not get personal tokens!');
            });
            return defer.promise;
        },

        addPersonalTokenRow: function (token) {
            var _this = this;
            var body = $('#personal-token-list');
            token.date = moment(token.issueTime).fromNow();
            var template = _.template(
                '<div class="row" data-token="<%=token.data%>">' +
                '    <div class="contents span13">' +
                '        <div class="col span10 centered" title="<%=token.data%>"><%=token.data%></div>' +
                '        <div class="col span10 centered" title="<%=token.date%>"><%=token.date%></div>' +
                '    </div>' +
                '    <div class="button-area span6 delete-button" title="Delete">' +
                '        <span class="button-icon icon-delete"></span><span>Delete</span>' +
                '    </div>' +
                '</div>'
            );
            var row = $(template({token: token}));
            body.append(row);
            row.find('.delete-button').on('click', function () {
                _this.openRemovePersonalTokenDialog($(this.parentNode).attr('data-token'));
            });
        },

        openRemovePersonalTokenDialog: function (token) {
            var _this = this;
            SettingsManager.deletePersonalToken(token).then(function () {
                _this.showPersonalTokens();
                toastr.success('Successfully deleted token');
            }).fail(function () {
                toastr.error('Failed to delete token');
            });
        },

        addNewPersonalToken: function () {
            var _this = this;
            SettingsManager.addNewPersonalToken().then(function () {
                _this.showPersonalTokens();
                toastr.success('Successfully added new personal token!');
            }).fail(function () {
                toastr.error('Failed to add new personal token.');
            });
        }
    });

    return SettingsController;
});