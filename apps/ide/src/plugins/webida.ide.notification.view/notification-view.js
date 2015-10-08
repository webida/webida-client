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

/**
 *
 * webida - notification plugin
 *
 */
define([
    'dojo/topic',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/logger/logger-client',
    'webida-lib/widgets/views/view',
    './notification',
    'text!./layout/notification.html',
    'xstyle/css!./style/style.css'
], function (
    topic,
    workbench,
    Logger,
    View,
    notification,
    template
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    function getView() {
        if (!this.view) {
            var view = new View('notificationTab', 'Notification');
            view.setContent('<div id="NotificationTab" style="width:100%; height:100%; overflow:hidden">');
            this.view = view;
        }
        return this.view;
    }

    function onViewAppended() {
        var opt = {
            title: 'Notification',
            key: 'N'
        };
        workbench.registToViewFocusList(this.view, opt);
        $('#NotificationTab').append(template);
        topic.subscribe('NOTIFY', function(type, msg, title) {
            notification.setNotification(type, msg, title);
        });
    }

    return {
        getView : getView,
        onViewAppended : onViewAppended
    };
});
