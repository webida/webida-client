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
    'services/ApplicationManager',
    'toastr',
    'q'
], function (_, ApplicationManager, toastr, Q) {
    'use strict';
    
    var ApplicationController = function () {};
    
    $.extend(ApplicationController.prototype, {
        
        execute: function () {            
            $('.section > div').hide();
            $('#area-applications').fadeIn(100);
            
            this.listMyApps();
            
        }, 
        
        listMyApps: function () {
            var _this = this;
            var defer = Q.defer();
            var body = $('#area-applications .body').html('');
            var loading = $('<div class="row info">Loading Apps...</div>');
            body.append(loading);
            
            ApplicationManager.loadMyApps().then(function (list) {
                loading.remove();
                // var host = ApplicationManager.getDeployHost(); 
                if (!list || list.length === 0) {
                    var noapp = $('<div class="row info">There are no apps.</div>');
                    body.append(noapp);
                    defer.resolve();
                    return;
                }
                 
                _.forEach(list, function (deploy) {
                    //var d = Q.defer();
                    //var id = _.uniqueId();
                    var desc = deploy.desc ? deploy.desc : '';
                    //'https://' + deploy.domain + '.' + host;
                    var url = ApplicationManager.getDeployedAppUrl(deploy.domain);
                    var ws = '';
                    var pj = '';
                     
                    if (deploy.srcurl) {
                        var splitSrcurl = deploy.srcurl.split('/');
                        ws = splitSrcurl[4] ? splitSrcurl[4] : '';
                        pj = splitSrcurl[5] ? splitSrcurl[5] : '';
                    }

                    var src = ws ? ws + '/' + pj : '';
                    /* jshint maxlen:200 */
                    var template =
//                         '<div class='panel pull'>' +
                         '    <div class="app-row" data-ws="' + deploy.appid + '">' +
                         '        <div class="app-contents app-url">' +
                         '            <div class="app-col-header span2"><span class="arrow"></span></div>' +
                         '            <div class="app-col-header span2">URL</div>' +
                         '            <div class="app-col-body span16" title="' + url + '">' + url + '</div>' +
                         '        </div>' +
                         '        <div class="button-area span3 launch-button centered" data-ws="' + deploy.domain + '" title="Open">' +
                         '            Open' +
                         '        </div>' +
                         '        <div class="button-area span3 delete-button" data-ws="' + deploy.appid + '" title="Delete">' +
                         '            <span class="button-icon icon-delete"></span><span>Delete</span>' +
                         '        </div>' +
                         '    </div>' +
                         '    <div class="app-fold">' +
                         '        <div class="app-row">' +
                         '            <div class="app-contents ">' +
                         '                <div class="app-col-body span1"></div>' +
                         '                <div class="app-col-header span2">Src</div>' +
                         '                <div class="app-col-body span8" title=' + src + '>' + src + '</div>' +
                         '                <div class="app-col-header  span3">Status</div>' +
                         '                <div class="app-col-body span5" title=' + deploy.status + '>' + deploy.status + '</div>' +
                         '            </div>' +
                         '        </div>' +
                         '        <div class="app-row">' +
                         '            <div class="app-contents app-url">' +
                         '                <div class="app-col-body span1"></div>' +
                         '                <div class="app-col-header  span2">Desc.</div>' +
                         '                <div class="app-col-body span16" title=' + desc + '>' + desc + '</div>' +
                         '            </div>' +
                         '        </div>' +
                         '</div>';
                    body.append(template);
                     
                });
                /* jshint maxlen:120 */
                
                $('.body > .app-row > .app-url').on('click', function () {
                    var $this = $(this);
                    var arrow = $this.find('span.arrow');
                    var childPane = $this.parent().next();
                    if ($this.attr('is-open') === 'true') {
                        
                        
                        $this.attr('is-open', false);
                        arrow.removeClass('selected');
                        
                        childPane.fadeOut(100);
                        
                    } else {
                        $this.attr('is-open', true);
                        arrow.addClass('selected');

                        childPane.fadeIn(100);
                        //_this.listProjects(this);
                    }
                });
                
                $('.body > .app-row > .launch-button').on('click', function () {
                    var name = $(this).attr('data-ws');
                    ApplicationManager.launchApp(name, true);
                });
                
                $('.body > .app-row > .delete-button').on('click', function () {
                    _this.openRemoveDeployDialog($(this));
                });
                
                defer.resolve();
            });
            
            
            return defer.promise;
        },
        openRemoveDeployDialog: function (deploy) {
            var _this = this;
            var dialog = $('#remove-deploy-dialog');
            var overlay = $('.overlay');
            
            overlay.fadeIn(100);
            dialog.fadeIn(100);
            
            var closeButton = $('#remove-deploy-dialog').find('.dialog-close');
            
            closeButton.off('click').on('click', function () {
                overlay.fadeOut(100);
                dialog.fadeOut(100);
            });
            
            dialog.find('.yes').off('click').on('click', function () {
                var id = deploy.attr('data-ws');
                
                
                ApplicationManager.deleteApp(id).then(function () {
                    _this.listMyApps().then(function () {
                        toastr.info('Successfully deleted the deployed app.');
                    });
                }).fail(function () {
                    toastr.error('Failed to delete deployed app!');
                });
                
                
                closeButton.trigger('click');
//                WorkspaceManager.removeWorkspace(wsName).then(function () {
//                    toastr.success('Successfully removed the workspace!');
//
//                    
//                    closeButton.trigger('click');
//                    
//                }).fail(function (e) {
//                    toastr.error('Failed to remove the workspace!');
//                });
            });
            
            dialog.find('.no').off('click').on('click', function () {
                closeButton.trigger('click');
            });
        }
    });
    
    return ApplicationController;
});