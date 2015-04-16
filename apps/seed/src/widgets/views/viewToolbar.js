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
    'other-lib/underscore/lodash.min',
    'dojo/aspect',
    'dojo/dom-geometry',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'dijit/Tooltip',
    'dijit/layout/BorderContainer',
    'widgets/views/viewmanager',
    'dojo/text!./template/_tmplViewToolbar.html',
    'dojo/domReady!'
], function(
    _,
    aspect,
    geometry,
    TabContainer,
    ContentPane,
    Tooltip,
    BorderContainer,
    vm,
    markup,
) {

    'use strict';

    var DEFAULT_SCROLL_WIDTH = 50;
    var CONTENT_CLASS = 'viewToolbarContent';
    var BTN_LEFT_CLASS = 'viewToolbarBtnLeft';
    var BTN_RIGHT_CLASS = 'viewToolbarBtnRight';

    var cd = require.toUrl('.');
    markup = markup.replace(/\$CD/g, cd);

    var toolbar = function(topElem, parentContentPane) {
        if (topElem && parentContentPane) {
            this.$topElem = $(topElem);
            this.contentSize = 0;
            this.$topElem.append(markup);
            this.$topElem.addClass('viewToolbarTopElem');

            this.$contentContainer = this.$topElem.find('.' + CONTENT_CLASS);
            this.content = null;
            this.$naviBtnLeft = this.$topElem.find('.' + BTN_LEFT_CLASS);
            this.$naviBtnRight = this.$topElem.find('.' + BTN_RIGHT_CLASS);

            this.setParentContentPane(parentContentPane);
            this.bindEvents();
            this.naviProgressing = null;
            this.timer = null;
        }
    };



    toolbar.prototype = {

        initialize: function() {

        },

        setParentContentPane: function(contentPane) {
            this.contentPane = contentPane;
            var self = this;
            aspect.after(contentPane, 'resize', function() {
                self.redraw();
            });
        },

        setContentSize: function(width) {
            this.contentSize = width;
            $(this.content).css('width', this.contentSize + 'px');
            this.redraw();
        },

        setContent: function(content) {
            this.$contentContainer.append(content);
            this.content = this.$contentContainer[0].children[0];
            $(this.content).css('width', this.contentSize + 'px');
            this.redraw();
        },

        getTopElem: function() {
            return this.topElem;
        },

        redraw: function() {
            if (this.content && (this.contentSize > 0)) {
                var contentContainerGeom =
                    geometry.getContentBox(this.$contentContainer[0]);
                if (contentContainerGeom.w < $(this.content).outerWidth()) {
                    this.showNaviBtn();
                } else {
                    this.showNaviBtn(true);
                }
            }
        },

        showNaviBtn: function(bHide) {
            if (bHide) {
                this.$topElem.removeClass('showNaviBtn');
            } else {
                this.$topElem.addClass('showNaviBtn');
            }
        },

        scrollToInit: function() {
            //            this.$contentContainer.css('left', 0);
            this.$contentContainer.scrollLeft(0);
        },

        scrollToLeft: function(value) {

            var scrollWidth = DEFAULT_SCROLL_WIDTH;
            if (value) {
                scrollWidth = value;
            }
            //            var curScrollPos = this.$contentContainer.css('left');
            //            if (curScrollPos && (curScrollPos.split('px').length > 1)) {
            //                curScrollPos = parseInt(curScrollPos.split('px')[0], 10) - scrollWidth;
            //                console.log(curScrollPos);
            //            }
            //
            //            this.$contentContainer.css('left', curScrollPos + 'px');

            var curScrollPos = this.$contentContainer.scrollLeft();
            scrollWidth = curScrollPos - scrollWidth;
            this.$contentContainer.scrollLeft(scrollWidth);



        },

        scrollToRight: function(value) {

            var scrollWidth = DEFAULT_SCROLL_WIDTH;
            if (value) {
                scrollWidth = value;
            }
            //            var curScrollPos = this.$contentContainer.css('left');
            //            if (curScrollPos && (curScrollPos.split('px').length > 1)) {
            //                curScrollPos = parseInt(curScrollPos.split('px')[0], 10) + scrollWidth;
            //                console.log(curScrollPos);
            //            }
            //
            //            this.$contentContainer.css('left', curScrollPos + 'px');

            var curScrollPos = this.$contentContainer.scrollLeft();
            scrollWidth = curScrollPos + scrollWidth;
            this.$contentContainer.scrollLeft(scrollWidth);

        },

        bindEvents: function() {
            var self = this;
            this.$naviBtnLeft.bind('click', function() {
                self.stopTimer();
                self.scrollToLeft();
            });

            this.$naviBtnRight.bind('click', function() {
                self.stopTimer();
                self.scrollToRight();
            });

            this.$naviBtnLeft.bind('mouseenter', function() {
                self.naviProgressing = 'left';
                self.startTimer();
            });

            this.$naviBtnLeft.bind('mouseleave', function() {
                self.naviProgressing = null;
            });

            this.$naviBtnRight.bind('mouseenter', function() {
                self.naviProgressing = 'right';
                self.startTimer();
            });

            this.$naviBtnRight.bind('mouseleave', function() {
                self.naviProgressing = null;
            });
        },

        startTimer: function() {
            var self = this;
            if (self.timer === null) {
                var timerCnt = 0;
                self.timer = setInterval(function() {
                    timerCnt++;
                    if (self.naviProgressing === null) {
                        clearInterval(self.timer);
                        self.timer = null;
                    } else if (timerCnt > 10) {
                        if (self.naviProgressing === 'left') {
                            self.scrollToLeft(10);
                        } else if (self.naviProgressing === 'right') {
                            self.scrollToRight(10);
                        }
                    }
                }, 50);
            }
        },

        stopTimer: function() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }

    };

    return toolbar;
});