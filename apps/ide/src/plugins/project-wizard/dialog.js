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
 * @file Provide dialog wrapper and utilities
 * @since 1.0.0
 * @author cimfalab@gmail.com
 * @module ProjectWizard/Dialog
 */
define([
    'dijit/registry',
    'dojo',
    'webida-lib/util/logger/logger-client'
], function (
    reg,
    dojo,
    Logger
) {
    'use strict';

    var logger = new Logger();
    logger.off();
    
    function Dialog() {
        this.id = null;
    }

    Dialog.prototype.setId = function (id) {
        this.id = id;
    };

    Dialog.prototype.setError = function (message) {
        this.setMessage(message);
        $('div.dijitDialogFocused .dialogMessage-inner').css('color', '#d9534f');
    };

    Dialog.prototype.setMessage = function (message) {
        $('.dialogMessage-inner').css('color', '#000000');
        //$('.dialogMessage-inner').html(message);
        if (this.id === null) {
            logger.error('Null id - ' + message);
        } else {
            var dlg = dojo.byId(this.id);
            var nodes = dojo.query('.dialogMessage-inner', dlg);
            dojo.forEach(nodes, function (node) {
                $(node).html(message);
            });
        }
    };

    Dialog.prototype.setValue = function (id, val) {
        var e = reg.byId(id);
        if (e) {
            e.set('value', val);
        } else {
            logger.warn('Element not defined: ' + id);
        }
    };

    Dialog.prototype.setComboValue = function (id, val) {
        this.setValue(id, val);
    };

    Dialog.prototype.setRadioValue = function (name, val) {
        var nodes = dojo.query('[name="' + name + '"]');
        dojo.forEach(nodes, function (node) {
            dijit.getEnclosingWidget(node).set('checked', node.value.toLowerCase() === val);
        });
    };

    Dialog.prototype.resetForm = function (form) {
        var _self = this;
        $.each(form, function (name, obj) {
            if (obj.type === 'radio') {
                _self.setRadioValue(name, '');
            } else {
                _self.setValue(name, '');
            }
        });
    };

    Dialog.prototype.checkCombo = function (id, msg) {
        var val = reg.byId(id).get('value');
        if (!val) {
            this.setMessage(msg);
            return null;
        }
        return val;
    };

    Dialog.prototype.getPropValue = function (o, prop) {
        var arr = prop.split('.');
        var obj = o;
        $.each(arr, function (index, value) {
            if (obj[value] === undefined) {
                obj = '';
                return false;
            }
            obj = obj[value];
        });
        return obj;
    };

    Dialog.prototype.getValue = function (id) {
        var e = reg.byId(id);
        if (e) {
            return e.get('value');
        } else {
            logger.warn('Element not defined: ' + id);
            return null;
        }
    };

    Dialog.prototype.getRadioValue = function (name) {
        var nodes = dojo.query('[name="' + name + '"]');
        var ret = null;
        dojo.forEach(nodes, function (node) {
            if (dijit.getEnclosingWidget(node).get('checked')) {
                ret = node.value;
                return false;
            }
        });
        return ret;
    };

    return Dialog;
});
