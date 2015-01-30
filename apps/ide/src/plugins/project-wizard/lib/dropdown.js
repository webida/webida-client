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
 * @Clipboard - wrapper for ZeroClipboard
 *
 * @version: 1.0.0
 * @since: 2014.04.18
 *
 * Src:
 *   plugins/project-wizard/dropdown.js
 */

define([], function () {
    'use strict';

    var DropDown = function (el) {
        this.dd = el;
        this.placeholder = this.dd.children('span');
        this.opts = this.dd.find('ul.dropdown > li');
        this.val = '';
        this.index = -1;
        this.initEvents();
        this.disabled = false;
    };

    DropDown.prototype = {
        initEvents : function () {
            var obj = this;

            obj.dd.on('click', function () {
                if (obj.disabled) {
                    return false;
                }
                $(this).toggleClass('active');
                return false;
            });

            obj.dd.on('mouseleave', function () {
                //$(this).removeClass('active');
                return false;
            });

            obj.opts.on('click', function () {
                /*
                var opt = $(this);
                obj.val = opt.text();
                obj.index = opt.index();
                obj.placeholder.text(obj.val);
                */
            });
        },
        getValue : function () {
            return this.val;
        },
        getIndex : function () {
            return this.index;
        },
        disable : function () {
            this.disabled = true;
        },
        enable : function () {
            this.disabled = false;
        }
    };

    return DropDown;
});
