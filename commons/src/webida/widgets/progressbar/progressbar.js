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
define(['dojo/text!./template/_tmplProgressbar.html'], function (template) {
    'use strict';

    var ProgressBar = function (elem) {
        this.state = null;
        this.value = null;
        this.label = null;
        this.realized = false;
        this.docFrag = document.createDocumentFragment();
        if (elem) {
            if (elem.nodeType) {
                this.$topElem = $(elem);
            } else if (elem.jquery) {
                this.$topElem = elem;
            }
        } else {
            this.$topElem = document.createElement('div');
        }
        this.init();
    };

    ProgressBar.CLASS_NAME = 'webida-app-progressbar';
    ProgressBar.STATE_PROCESSING = 'processing';
    ProgressBar.STATE_LODING = 'loading';
    ProgressBar.STATE_DONE = 'done';
    ProgressBar.MIN_VALUE = 0;
    ProgressBar.MAX_VALUE = 100;

    ProgressBar.prototype = {

        init : function () {
            $(this.docFrag).append(template);
            this.elems = {};
            // Internet Explorer does not support 'children' property for DocumentFragment
            //  cf.)) https://developer.mozilla.org/en-US/docs/Web/API/ParentNode.children
            if (!this.docFrag.children) {
                this.docFrag.children = [];
                var children = this.docFrag.childNodes;
                for (var i = 0; i < children.length; i++) {
                    if (children[i].nodeType === 1) { // ELEMENT_NODE
                        this.docFrag.children.push(children[i]);
                    }
                }
            }
            this.elems.loadingbar = $(this.docFrag.children[1]);
            this.elems.loadingbaranim = $(this.elems.loadingbar[0].children[0]);

            this.setState(ProgressBar.STATE_LODING);
            this.$topElem.addClass(ProgressBar.CLASS_NAME);
            this._realize();
        },

        setState: function (state) {
            if (this.state === state) {
                return;
            }
            if (state === ProgressBar.STATE_PROCESSING) {
                this.state = state;
                this.elems.loadingbaranim.css('display', 'none');
            } else if (ProgressBar.STATE_LODING) {
                this.state = state;
                this.elems.loadingbaranim.css('display', 'block');
            } else if (ProgressBar.STATE_DONE) {
                this.setValue(ProgressBar.MAX_VALUE = 100);
                this.elems.loadingbaranim.css('display', 'none');
                this.elems.loadingbar('display', 'block');
                this.state = state;
            }
        },

        setLodingStyle : function () {
            this.setState(this.setState(ProgressBar.STATE_LODING));
        },

        setValue : function (value) {
            if (value >= 0 && value <= 100) {
                this.setState(ProgressBar.STATE_PROCESSING);
                this.value = value;
                this.elems.loadingbar.css('width', value + '%');
            }
        },

        getValue : function () {
            return this.value;
        },

        getLabel : function () {
            return this.label;
        },

        setLabel :  function (label) {
            this.label = label;
        },

        complete: function () {
            this.setState(ProgressBar.STATE_DONE);
        },

        destroy : function () {
            if (this.topElem) {
                $(this.topelem).remove();
            }
            this.state = null;
            this.value = 0;
            this.topElem = null;
        },

        show : function () {
//            if (this.realized === false) {
//            this._realize();
//                this.realized = true;
//            }
            this.$topElem.css('display', 'block');
        },

        _realize : function () {
            if (this.realized === false) {
                this.realized = true;
                this.$topElem[0].appendChild(this.docFrag);
            }
        },

        hide : function () {
            this.$topElem.css('display', 'none');
        },

        getDomNode : function () {
            return this.$topElem[0];
        },
    };

    return ProgressBar;
});
