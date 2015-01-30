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
    'services/FS',
    'services/WorkspaceManager',
    'services/ApplicationManager',
    'q'
], function (_, FS, WorkspaceManager, ApplicationManager, Q) {
    'use strict';
    
    var StatController = function () {};
    
    $.extend(StatController.prototype, {
        
        execute: function () {
            var _this = this;
            
            $('.stats').html('');
            
            _this.showQuotaUsage();
            _this.showTotalProjects();
            _this.showDeployedProjects();
        },
        
        showQuotaUsage: function () {
            var area = $('.stats');
            var div = '<div class="panel">' +
                '    <h2>Quota Usage</h2>' +
                '    <div class="chart" data-percent="0"><span class="percentage"></span></div>' +
                '    <div class="quota"></div>' +
                '</div>';
            
            area.append(div);
            
            Q.all([FS.getQuotaUsage(), FS.getQuotaLimit()]).spread(function (usage, limit) {
                var percent = parseInt(+usage / +limit * 100, 10);
                
                $('.chart').attr('data-percent', percent);
                
                $('.chart').easyPieChart({
                    lineWidth: 4,
                    lineCap: 'butt',
                    easing: 'easeOutBounce',
                    onStep: function (from, to, percent) {
                        $(this.el).find('.percentage').text(Math.round(percent));
                    }
                });
                
                var usageMB = parseInt(usage / (1024 * 1024), 10);
                var limitMB = parseInt(limit / (1024 * 1024), 10);
                
                $('.quota').text(usageMB + 'MB / ' + limitMB + 'MB');
            });
        },
        
        showTotalProjects: function () {
            var area = $('.stats');
            var div = $('<div class="panel">' +
                        '    <h2>Total Projects</h2>' +
                        '    <div class="value"></div>' +
                        '</div>');
            
            area.append(div);
            
            WorkspaceManager.getWorkspaces().then(function (list) {
                var total = 0;
                
                _.forEach(list, function (ws) {
                    _.forEach(ws.projects, function (proj) {
                        if (proj.isProject) {
                            total++;
                        }
                    });
                });
                
                var number = div.find('div');
                number.html(total).hide().fadeIn(300);
            });
        },
        
        showDeployedProjects: function () {
            var area = $('.stats');
            var div = $('<div class="panel">' +
                        '    <h2>Deployed Apps</h2>' +
                        '    <div class="value"></div>' +
                        '</div>');
            
            area.append(div);
            
            ApplicationManager.loadMyApps().then(function (list) {
                var total = 0;
                
                if (list) {
                    total = list.length;
                }
                
                var number = div.find('div');
                number.html(total).hide().fadeIn(300);
            });
        }
    });
    
    return StatController;
});