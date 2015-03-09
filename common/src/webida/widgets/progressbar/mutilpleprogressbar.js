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
 * Src:
 *   widgets/progressbar/progressbar.js
 */
define(['./progressbar.js'], function (ProgressBar) {

    'use strict';

    var MultipleProgressbar = function (elem) {
        this.baseProgressbar = new ProgressBar(elem);
        this.barList = [];
        this.barList.push(this.baseProgressbar);
    };

    MultipleProgressbar.prototype = {

        clone : function (elem) {
            this.barList.push(new ProgressBar(elem));
        },

        setState: function (state) {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].setState(state);
            }
        },

        getValue : function () {
            return this.baseProgressbar.getValue();
        },

        setValue : function (value) {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].setValue(value);
            }
        },

        getLabel : function () {
            return this.baseProgressbar.getLabel();
        },

        setLabel :  function (label) {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].setLabel(label);
            }
        },

        complete: function () {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].setState(ProgressBar.STATE_DONE);
            }
        },

        destroy : function () {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].destroy();
            }
        },

        show : function () {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].show();
            }
        },

        hide : function () {
            for (var i = 0; i < this.barList.length; i++) {
                this.barList[i].hide();
            }
        },

        getProgressbarList : function () {
            return this.barList;
        }
    };

    return MultipleProgressbar;
});
