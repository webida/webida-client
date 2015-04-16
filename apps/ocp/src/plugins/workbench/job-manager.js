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
 * @fileoverview webida - workbench
 *
 * @version: 0.1.0
 * @since: 2013.09.25
 *
 */

define([
    'webida-lib/widgets/progressbar/progressbar'
], function(ProgressBar) {
    'use strict';

    var jobManager = {

        ID_PREFIX: 'JOB_ID',
        MAX_JOB_COUNT: 100,
        jobList: [],
        idMap: {},
        $progressbarTitleElem: null, // $('.app-workbench-progressbar-title'),
        baseProgressBar: null, // new ProgressBar($('.app-workbench-progressbar')[0]),
        initialized: false,

        getId: function() {
            for (var i = 0; i < this.MAX_JOB_COUNT; i++) {
                var id = this.ID_PREFIX + i;
                if (!this.idMap.hasOwnProperty(id)) {
                    return id;
                }
            }
            return null;
        },

        redraw: function() {
            var length = this.jobList.length;
            if (length > 0) {
                this.baseProgressBar.show();
                this.$progressbarTitleElem.text('[ ' + this.jobList[length - 1].title + ' ] ');
            } else {
                this.baseProgressBar.hide();
                this.$progressbarTitleElem.html('');
            }
        },

        init: function() {
            if (!this.initialized) {
                this.initialized = true;
                this.$progressbarTitleElem = $('.app-workbench-progressbar-title');
                this.baseProgressBar = new ProgressBar($('.app-workbench-progressbar')[0]);
                this.baseProgressBar.setLodingStyle();
                this.baseProgressBar.hide();
            }

        },

        addJob: function(title) {
            if (!this.initialized) {
                this.init();
            }
            var id = this.getId();
            var progressbar = null;
            if (id) {
                this.jobList.push({
                    id: id,
                    progressbar: progressbar,
                    title: title
                });
                this.idMap[id] = id;
                this.redraw();
                return id;
            }

            return null;
        },

        removeJob: function(id) {
            if (id) {
                for (var i = 0; i < this.jobList.length; i++) {
                    if (id === this.jobList[i].id) {
                        delete this.idMap[id];
                        this.jobList.splice(i, 1);
                        this.redraw();
                        return true;
                    }
                }
            }
            return false;
        }
    };

    return jobManager;
});