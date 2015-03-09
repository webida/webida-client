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
 * PopupDialog.js
 *
 * Version 0.1
 *
 * Author: Junsik Shim <junsik.shim@webida.org>
 */

define(['dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/Deferred',
        'dojo/_base/array',
        'dojo/dom-class',
        'dojo/aspect',
        'dojo/keys',
        'dojo/on',
        'dijit/focus',
        'dijit/_Widget',
        'dijit/_TemplatedMixin',
        'dijit/_WidgetsInTemplateMixin',
        'dijit/Dialog',
        'dijit/form/Button',
        'dijit/form/TextBox'
       ],
function (declare, lang, Deferred, array, domClass, aspect, keys, on, focus,
          _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, Dialog, Button, TextBox) {
    'use strict';

    var PopupDialogInner = declare(Dialog, {

        title: 'Title',     // Title of the dialog - Required
        message: 'Message', // Contents of the dialog - Required
        type: 'normal',     // Dialog type [normal(default), success, error] - Required
        refocus: false,

        constructor: function (options) {
            lang.mixin(this, options);

            var template = '<div style="width:300px;">' +
                    '<div class="dijitDialogPaneContentArea">' +
                    '<div data-dojo-attach-point="contentNode">' +
                    '${message}' +
                    '</div>' +
                    '<div id="_PopupDialog__prompt-input"></div>' +
                    '</div>' +
                    '<div class="dijitDialogPaneActionBar">';

            array.forEach(this.buttons, function (button) {
                var buttonType = 'buttonNo';

                if (button.type === 'yes') {
                    buttonType = 'buttonYes';
                }

                template += '<button data-dojo-type="dijit.form.Button" data-dojo-attach-point="' +
                    buttonType + '">' + button.text + '</button>';
            });

            template += '</div>' + '</div>';

            var message = this.message;

            var contentWidget = new (declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
                templateString: template,
                message: message
            }))();

            contentWidget.startup();
            this.content = contentWidget;
        },

        postCreate: function () {
            Dialog.prototype.postCreate.call(this, arguments);
            domClass.add(this.domNode, 'popup-dialog');

            if (this.type === 'success') {
                domClass.add(this.titleBar, 'success');
            } else if (this.type === 'error') {
                domClass.add(this.titleBar, 'error');
            }

            if (this.content.buttonYes) {
                this.connect(this.content.buttonYes, 'onClick', 'onExecute');
            }

            if (this.content.buttonNo) {
                this.connect(this.content.buttonNo, 'onClick', 'onCancel');
            }

            this._modalconnects.push(on(this.domNode, 'keydown', lang.hitch(this, '_onArrowKey')));
        },

        _onArrowKey: function (e) {
            var parent = dojo.query('.popup-dialog .dijitDialogPaneActionBar');
            var curNode = focus.curNode;

            var child, node;
            switch (e.keyCode) {
            case keys.LEFT_ARROW:
                for (child = parent[0].lastChild; child; child = child.previousSibling) {
                    node = child.firstChild.firstChild;

                    if (node === curNode) {
                        var prev;
                        if (!child.previousSibling) {
                            prev = parent[0].lastChild.firstChild.firstChild;
                        } else {
                            prev = child.previousSibling.firstChild.firstChild;
                        }
                        if (prev) {
                            prev.focus();
                        }

                        break;
                    }
                }

                e.preventDefault();
                e.stopPropagation();

                break;

            case keys.RIGHT_ARROW:
                for (child = parent[0].firstChild; child; child = child.nextSibling) {
                    node = child.firstChild.firstChild;

                    if (node === curNode) {
                        var next;
                        if (!child.nextSibling) {
                            next = parent[0].firstChild.firstChild.firstChild;
                        } else {
                            next = child.nextSibling.firstChild.firstChild;
                        }
                        if (next) {
                            next.focus();
                        }

                        break;
                    }
                }

                e.preventDefault();
                e.stopPropagation();

                break;

            default:
                return true;
            }
        },

        onExecute: function () {
            // dummy
        },

        onCancel: function () {
            // dummy
        }
    });

    var PopupDialog = {};

    PopupDialog._init = function (options) {
        var defer = new Deferred();
        var dialog = new PopupDialogInner(options);
        var signal, signals = [];

        if (options.prompt) {
            var myTextBox = new TextBox({
                name: 'input',
                value: options.value,
                placeHolder: options.placeHolder,
                style: { width: '100%', 'margin-top': '10px' }
            }, '_PopupDialog__prompt-input');
            on(myTextBox, 'keydown', function (e) {
                if (e.keyCode === keys.ENTER) {
                    dialog.onExecute();
                }
            });
        }
        dialog.startup();

        var destroyDialog = function () {
            array.forEach(signals, function (signal) {
                signal.remove();
            });

            //delete signals;

            setTimeout(function () {
                dialog.destroyRecursive();
            }, 1000);
        };

        signal = aspect.after(dialog, 'onExecute', function () {
            destroyDialog();
            if (options.prompt) {
                defer.resolve(dijit.byId('_PopupDialog__prompt-input').getValue());
            } else {
                defer.resolve();
            }
        });
        signals.push(signal);

        signal = aspect.after(dialog, 'onCancel', function () {
            destroyDialog();
            defer.reject();
        });
        signals.push(signal);

        dialog.show();

        return defer.promise;
    };

    PopupDialog._checkButtons = function (options, num) {
        var defer = new Deferred();

        switch (num) {
        case 2:
            if (options.buttons.length !== 2) {
                throw new Error('Requires two buttons');
            }

            if (options.buttons[0].type === options.buttons[1].type) {
                throw new Error('The two buttons must have different type values');
            }

            break;

        case 1:
            if (options.buttons.length !== 1) {
                throw new Error('Requires one button');
            }

            if (options.buttons[0].type !== 'yes') {
                throw new Error('The button should have \'yes\' as the type value');
            }

            break;

        default:
            break;
        }

        defer.resolve();

        return defer.promise;
    };

    PopupDialog.confirm = function (options) {
        return (function () {
            var defer = new Deferred();

            if (!options) {
                throw new Error('Must provide \'options\' argument');
            }

            options.buttons = options.buttons ||
                [{
                    text: 'OK',
                    type: 'yes'
                }, {
                    text: 'Cancel',
                    type: 'no'
                }];

            defer.resolve();

            return defer.promise;
        })()
        .then(lang.hitch(this, this._checkButtons, options, 2))
        .then(lang.hitch(this, this._init, options));
    };

    PopupDialog.yesno = function (options) {
        return (function () {
            var defer = new Deferred();

            if (!options) {
                throw new Error('Must provide \'options\' argument');
            }

            options.buttons = options.buttons ||
                [{
                    text: 'Yes',
                    type: 'yes'
                }, {
                    text: 'No',
                    type: 'no'
                }];

            defer.resolve();

            return defer.promise;
        })()
        .then(lang.hitch(this, this._checkButtons, options, 2))
        .then(lang.hitch(this, this._init, options));
    };

    PopupDialog.prompt = function (options) {
        if (options) {
            options.prompt = true;
        }
        return PopupDialog.yesno(options);
    };

    PopupDialog.alert = function (options) {
        return (function () {
            var defer = new Deferred();

            if (!options) {
                throw new Error('Must provide \'options\' argument');
            }

            options.buttons = options.buttons ||
                [{
                    text: 'OK',
                    type: 'yes'
                }];

            defer.resolve();

            return defer.promise;
        })()
        .then(lang.hitch(this, this._checkButtons, options, 1))
        .then(lang.hitch(this, this._init, options));
    };

    return PopupDialog;
});
