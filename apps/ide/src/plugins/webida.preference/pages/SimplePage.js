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
 * @since: 15. 9. 2
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/util/genetic',
    './PreferencePage',
    'dojo/aspect',
    'dijit/registry',
    'dijit/form/CheckBox',
    'dijit/form/ComboBox',
    'dijit/form/TextBox',
    'dijit/form/HorizontalSlider',
    'dijit/form/HorizontalRule',
    'dijit/form/HorizontalRuleLabels',
    'dojo/store/Memory',
    'xstyle/css!../style/simple-page-style.css'
], function (
    _,
    genetic,
    PreferencePage,
    aspect,
    reg,
    CheckBox,
    ComboBox,
    TextBox,
    HorizontalSlider,
    HorizontalRule,
    HorizontalRuleLabels,
    Memory
) {
    'use strict';

    function SimplePage(store, pageData) {
        PreferencePage.apply(this, arguments);
        this.pageData = pageData;
        this.components = [];
        var self = this;
        store.setValidator(function (key, value) {
            var invalidMsg;
            var schema = _.find(self.pageData, {key: key});
            if (schema) {
                var type = schema.type;
                var opt = schema.opt;
                switch (type) {
                    case 'checkbox':
                        if (!_.isBoolean(value)) {
                            invalidMsg = 'The value of \'' + opt.name + '\' should be boolean';
                        }
                        break;
                    case 'select':
                        var matched = false;
                        for (var i = 0; i < opt.items.length; i++) {
                            if ((opt.items[i].value && opt.items[i].value === value) ||
                                (!opt.items[i].value && opt.items[i] === value)) {
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) {
                            invalidMsg = 'The value of \'' + opt.name +
                                '\' should be one of [' + opt.items.join(',') + ']';
                        }
                        break;
                    case 'slider':
                        if (opt.min > value || opt.max < value) {
                            invalidMsg = 'The value of \' + opt.name + \' should be a number between ' +
                                opt.min + ' and ' + opt.max;
                        }
                        break;
                    case 'text':
                        if (!_.isString(value)) {
                            invalidMsg = 'The value of \'' + opt.name + '\' should be string';
                        }
                        break;
                }
            }
            return invalidMsg;
        });
    }

    genetic.inherits(SimplePage, PreferencePage, {
        getPage: function () {
            var fieldSchema = this.pageData;
            if (fieldSchema) {
                for (var i = 0; i < fieldSchema.length; i++) {
                    if (fieldSchema[i].type === 'group') {
                        this._addGroup(fieldSchema[i].title);
                        continue;
                    }
                    this.components.push(this._addField(fieldSchema[i]));
                }
            }
            return this.ui;
        },
        onPageAppended: function () {
            PreferencePage.prototype.onPageAppended.call(this);
        },
        onPageRemoved: function () {
            for (var i = 0;  i < this.components.length; i++) {
                this.components[i].destroy();
            }
            PreferencePage.prototype.onPageRemoved.call(this);
        },
        reload: function () {
            var self = this;
            _.forEach(this.components, function (comp) {
                var key = comp.get('id');
                if (key) {
                    comp.set('value', self.store.getValue(key), false);
                }
            });
        },
        _addGroup: function (title) {
            $('<h2>' + title + '</h2>').appendTo(this.ui);
        },
        _addField: function (field) {
            var self = this;
            var added;
            var key = field.key;
            var type = field.type;
            var opt = field.opt;
            var value = this.store.getValue(key);
            var label;
            var wrapper = $('<div class="component-wrap"></div>');
            wrapper.appendTo(self.ui);
            switch (type) {
                case 'checkbox':
                    var checkbox = $('<input>');
                    label = $('<label>' + opt.name + '</label>');
                    checkbox.appendTo(wrapper);
                    label.appendTo(wrapper);

                    checkbox = new CheckBox({
                        id: key,
                        name: 'checkBox',
                        checked: value,
                        onChange: function (value) {
                            self.store.setValue(key, value);
                        }
                    }, checkbox[0]);
                    added = checkbox;

                    break;
                case 'select':
                    var select = $('<input>');
                    label = $('<label>' + opt.name + '</label>');
                    label.appendTo(wrapper);
                    select.appendTo(wrapper);

                    var dataSource = [];
                    _.each(opt.items, function (item) {
                        if (typeof item === 'string') {
                            dataSource.push({
                                name: item,
                                id: item
                            });
                        } else {
                            dataSource.push({
                                name: item.label,
                                id: item.value
                            });
                        }
                    });

                    var dataStore = new Memory({
                        data: dataSource
                    });

                    var currentId = value;
                    var currentValue = _.findWhere(dataSource, {id: currentId});
                    if (currentValue) {
                        currentValue = currentValue.name;
                    } else {
                        currentValue = currentId;
                    }

                    var comboBox = new ComboBox({
                        //name: "state",
                        id: key,
                        store: dataStore,
                        searchAttr: 'name',
                        value: currentValue,
                        maxHeight: 300,
                        style: 'margin-top: 5px; margin-bottom: 5px; margin-left: 5px;',
                        onChange: function (value) {
                            var item = _.findWhere(dataSource, {name: value});
                            if (item) {
                                self.store.setValue(key, item.id);
                            }
                        }
                    }, select[0]);
                    added = comboBox;

                    break;
                case 'slider':
                    label = $('<span>').text(opt.name);
                    label.appendTo(wrapper);

                    var slider = $('<div>').appendTo(wrapper);

                    slider = new HorizontalSlider({
                        id: key,
                        minimum: opt.min,
                        maximum: opt.max,
                        intermediateChanges: false,
                        style: 'width: 300px',
                        discreteValues: (opt.max - opt.min + 1),
                        value: value,
                        onChange: function (value) {
                            self.store.setValue(key, value);
                        }
                    }, slider[0]);
                    added = slider;

                    var rule = new HorizontalRule({
                        container: 'bottomDecoration',
                        count: slider.get('discreteValues'),
                        style: 'height: 5px'
                    });

                    var ruleLabel = new HorizontalRuleLabels({
                        container: 'bottomDecoration',
                        style: 'height: 1em; font-size: 75%; color: grey',
                        labels: opt.labels
                    });

                    slider.addChild(rule);
                    slider.addChild(ruleLabel);

                    break;
                case 'text':
                    var textBox = $('<input>');
                    label = $('<span>').text(opt.name);
                    var br = $('<br>');

                    label.appendTo(wrapper);
                    textBox.appendTo(wrapper);
                    br.appendTo(wrapper);

                    var text = new TextBox({
                        id: key,
                        value: value,
                        style: 'margin-top: 5px; margin-bottom: 5px; margin-left: 5px;',
                        onChange: function (value) {
                            self.store.setValue(key, value);
                        }
                    }, textBox[0]);
                    added = text;
                    break;
            }
            if (opt && opt.enabledOn) {
                /*jshint -W004 */
                var checkbox;
                /*jshint +W004 */
                if ((checkbox = reg.byId(opt.enabledOn)) && checkbox.isInstanceOf(CheckBox)) {
                    added.set('disabled', !checkbox.get('value'));
                    aspect.after(checkbox, 'onChange', function (newVal) {
                        added.set('disabled', !newVal);
                    }, true);
                } else {
                    throw new Error('No check-box option declared yet with that name "' + opt.enabledOn + '"');
                }
            }
            return added;
        }
    });

    return SimplePage;
});
