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
 * ButtonedDialog.js
 *
 * Version 0.1
 *
 * Author: Hyunik Na <hina@webida.org>
 */

define(['dojo/_base/declare',
        'dojo/aspect',
        'dijit/Dialog',
        'dijit/registry',
        'dojo/domReady!'],
function (declare, aspect, Dialog, registry) {
    'use strict';

    var dialogNum = 0;

    function markupForActionBar(buttonSpecs, dialog) {
        function markupForPlainButton(buttonSpec, i) {
            buttonSpec.id = (buttonSpec.id || ('buttoned-dialog-button-' + dialog + '-' + i));
            return ' <button id="' + buttonSpec.id + '" data-dojo-type="dijit/form/Button"' +
                (buttonSpec.disabledOnShow ? ' data-dojo-props="disabled:true"' : '') +
                '> ' + buttonSpec.caption + ' </button>\n';
        }

        function markupForComboButton(buttonSpec, i) {
            function markupForSubitems(subitemSpecs) {
                var markup = '  <span data-dojo-type="dijit/DropDownMenu">\n';

                subitemSpecs.forEach(function (subitemSpec, j) {
                    subitemSpec.id = (subitemSpec.id || ('buttoned-dialog-subitem-' + dialog + '-' + i + '-' + j));
                    markup += ('   <span id="' + subitemSpec.id  +
                               '" data-dojo-type="dijit/MenuItem"> ' + subitemSpec.caption + '</span>\n');
                });

                markup += '  </span>\n';
                return markup;
            }

            buttonSpec.id = (buttonSpec.id || ('buttoned-dialog-button-' + dialog + '-' + i));
            return ' <div id="' + buttonSpec.id + '" data-dojo-type="dijit/form/ComboButton"' +
                (buttonSpec.disabledOnShow ? ' data-dojo-props="disabled:true"' : '') +
                '>\n  <span> ' + buttonSpec.caption + ' </span>\n' +
                markupForSubitems(buttonSpec.subitems) + ' </div>\n';
        }

        if (buttonSpecs.length) {
            var markup = '<div class="dijitDialogPaneActionBar"> \n';

            buttonSpecs.forEach(function (buttonSpec, i) {
                if (buttonSpec.subitems instanceof Array && buttonSpec.subitems.length) {
                    markup += markupForComboButton(buttonSpec, i);
                } else {
                    markup += markupForPlainButton(buttonSpec, i);
                }
            });

            markup += '</div> \n';
            return markup;
        } else {
            return '';
        }
    }

    var ButtonedDialog = declare(Dialog, {

        constructor: function (params/*, srcNodeRef*/) {
            var methodName;

            // check required fields
            if (!(params.buttons instanceof Array)) {
                throw new Error('"buttons" (of Array type) is a required field in the parameter');
            }
            if (typeof params.methodOnEnter !== 'string' && params.methodOnEnter !== null) {
                throw new Error('"methodOnEnter" (a string or null) is a required field in the parameter');
            }

            // temporary, TODO: remove the following two if clauses
            if (this.buttons !== undefined) {
                alert('Property "buttons" already exists!');
                throw new Error('unexpected');
            }
            if (this.methodOnEnter !== undefined) {
                alert('Property "methodOnEnter" already exists!');
                throw new Error('unexpected');
            }

            // check required properties in each button spec.
            params.buttons.forEach(function (buttonSpec, i) {

                if (buttonSpec.id && typeof buttonSpec.id !== 'string') {
                    throw new Error('Element ' + i +
                                    ' in the params.buttons array has an invlaid "id" property');
                }
                if (typeof buttonSpec.caption !== 'string') {
                    throw new Error('Element ' + i +
                                    ' in the params.buttons array has an invlaid "caption" property');
                }
                if (typeof (methodName = buttonSpec.methodOnClick) !== 'string') {
                    throw new Error('Element ' + i +
                                    ' in the params.buttons array has an invlaid "methodOnClick" property');
                }
            });

            this.dialogNum = dialogNum++;
            this.buttons = params.buttons;
            this.methodOnEnter = params.methodOnEnter;
        },

        setContentArea: function (markup) {
            if (typeof markup !== 'string') {
                throw new Error('Currently, only a markup (a string) is supported');
            }

            var markupForContentArea = '<div class="dijitDialogPaneContentArea">' + markup + '</div>';
            if (this.markupForActionBar === undefined) {
                this.markupForActionBar = markupForActionBar(this.buttons, this.dialogNum);
            }
            Dialog.prototype.set.call(this, 'content', markupForContentArea + this.markupForActionBar);
        },

        postCreate: function () {
            var ret = Dialog.prototype.postCreate.apply(this, arguments);
            var self = this;

            if (this.methodOnEnter !== null) {
                this.domNode.addEventListener('keydown', function (evt) {
                    if (evt.keyCode === 13) {	// Enter
                        if (typeof self[self.methodOnEnter] === 'function') {
                            self[self.methodOnEnter].call(self, evt);
                            evt.stopPropagation();
                            evt.preventDefault();
                        } else {
                            alert('Method "' + self.methodOnEnter + '" does not exist in the dialog');
                        }
                    }
                });
            }

            aspect.before(this, 'onLoad', function () {
                function setWidthsAndClickHandlers(buttonSpecs, level) {
                    buttonSpecs.forEach(function (buttonSpec, i) {
                        var widget = registry.byId(buttonSpec.id);
                        if (widget) {
                            // set click event handler
                            widget.onClick = function () {
                                if (typeof self[buttonSpec.methodOnClick] === 'function') {
                                    self[buttonSpec.methodOnClick].call(self);
                                } else {
                                    alert('Method "' + buttonSpec.methodOnClick + '" does not exist in the dialog');
                                }
                            };


                            if (level === 0) {
                                var buttonNodes = widget.domNode.getElementsByClassName('dijitButtonNode');
                                buttonNodes[0].setAttribute('style', 'width: ' +  (self.buttonsWidth || '70px'));
                                if (buttonSpec.subitems) {
                                    setWidthsAndClickHandlers(buttonSpec.subitems, 1);
                                }
                            }
                        } else {
                            alert('The button widget ' + i + ' is not present for ' + buttonSpec.id);
                        }
                    });
                }

                //console.log('hina temp: after onLoad');
                setWidthsAndClickHandlers(self.buttons, 0);
            });

            return ret;
        },

        set: function (name) {
            if (name === 'content') {
                throw new Error('Setting content using set method is blocked in ' +
                                'ButtonedDialog class. Use setContentArea instead');
            } else {
                return Dialog.prototype.set.apply(this, arguments);
            }
        },

        setContent: function () {
            throw new Error('Method setContent is blocked in ButtonedDialog class. ' +
                            'Use setContentArea instead');
        }
    });

    return ButtonedDialog;
});
