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
    'webida-lib/plugin-manager-0.1',
    'webida-lib/util/browserUtil',
    './store',
    'text!./preferences.html',
    'dojo/aspect',
    'dijit/registry',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/ComboBox',
    'dijit/form/TextBox',
    'dojo/store/Memory',
    'dijit/form/HorizontalSlider',
    'dijit/form/HorizontalRule',
    'dijit/form/HorizontalRuleLabels',
    'dijit/layout/BorderContainer',
    'dijit/layout/ContentPane',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'
], function (_, pm, BrowserUtil, store, markup, aspect, reg, Button,
              CheckBox, ComboBox, TextBox, Memory, HorizontalSlider,
              HorizontalRule, HorizontalRuleLabels, BorderContainer,
              ContentPane, ButtonedDialog) {
    'use strict';

    var showing = false;
    var extpoint = (function () {
        var pages = pm.getExtensions('webida.common.workbench:preference-page');
        pages = _.sortBy(pages, function (page) { return page.hierarchy; });

        return {
            getPagesList: function () {
                return pages;
            },

            getPageByHierarchy: function (hierarchy) {
                return _.find(pages, function (page) { return page.hierarchy === hierarchy; });
            }
        };
    })();

    return {
        show: function () {
            function openPage(pageHierarchy, bDefault) {
                openingPage = pageHierarchy;
                var page = extpoint.getPageByHierarchy(pageHierarchy);
                $(innerleftPanel.domNode).find('.' + categoryItemClass).removeClass('selected');
                innerCenterPanel.destroyDescendants();
                require([page.module], function (mod) {
                    var fieldCreator = {
                        page: page,
                        addField: addField
                    };
                    if (bDefault) {
                        fieldCreator.addField = addFieldByDefault;
                    }
                    if (typeof mod[page.handler] === 'function') {
                        mod[page.handler](fieldCreator);
                    }
                    $(innerleftPanel.domNode).find('[hierarchy="' + pageHierarchy + '"]').addClass('selected');
                });
            }

            function getCurrentValue(fieldId, defaultValue) {
                if (changed[fieldId] === undefined) {
                    var prev = store.getValue(fieldId);
                    if (prev === undefined) {
                        return defaultValue;
                    } else {
                        return prev;
                    }
                } else {
                    return changed[fieldId];
                }
            }

            function makeFieldTitleElement(title) {
                if (!title) {
                    return null;
                }

                var titleElement = $('<label>' + title +
                                     '</label><div style="height:2px; background:#CDD8E3;border-bottom:1px ' +
                                     'solid #C0D3E5; margin-top:5px; margin-bottom:5px"><div>');
                return titleElement;
            }

            function addFieldByDefault(fieldId, fieldType, opt) {
                var field = null;
                field = _addField(fieldId, fieldType, opt, opt['default']);
                if (getCurrentValue(fieldId, opt['default']) !== opt['default']) {
                    changed[fieldId] = opt['default'];
                }
                return field;
            }

            function addField(fieldId, fieldType, opt) {
                var field = null;
                field = _addField(fieldId, fieldType, opt, getCurrentValue(fieldId, opt['default']));
                return field;
            }

            function _addField(fieldId, fieldType, opt, fieldValue) {
                var field = null;
                var itemContainer = $('<div style="margin-left: ' + (opt.enabledOn ? 25 : 5) +
                        'px; margin-top:5px">');
                var title = makeFieldTitleElement(opt.title);
                var label;
                switch (fieldType) {
                case 'checkbox':
                    var checkbox = $('<input>');
                    label = $('<label>' + opt.name + '</label>');
                    if (title) {
                        title.appendTo(itemContainer);
                    }
                    checkbox.appendTo(itemContainer);
                    label.appendTo(itemContainer);
                    itemContainer.appendTo(centerPanelDomNode);

                    checkbox = new CheckBox({
                        id: fieldId,
                        name: 'checkBox',
                        checked: fieldValue,
                        onChange: function (value) {
                            changed[fieldId] = value;
                        }
                    }, checkbox[0]);
                    field = checkbox;

                    break;
                case 'select':
                    var select = $('<input>');
                    label = $('<label>' + opt.name + '</label>');
                    if (title) {
                        title.appendTo(itemContainer);
                    }
                    label.appendTo(itemContainer);
                    select.appendTo(itemContainer);
                    itemContainer.appendTo(centerPanelDomNode);

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

                    var currentId = fieldValue;
                    var currentValue = _.findWhere(dataSource, {id: currentId});
                    if (currentValue) {
                        currentValue = currentValue.name;
                    } else {
                        currentValue = currentId;
                    }

                    var comboBox = new ComboBox({
                        //name: "state",
                        store: dataStore,
                        searchAttr: 'name',
                        value: currentValue,
                        maxHeight: 300,
                        style: 'margin-top: 5px; margin-bottom: 5px; margin-left: 5px;',
                        onChange: function (value) {
                            var item = _.findWhere(dataSource, {name: value});
                            changed[fieldId] = item.id;
                        }
                    }, select[0]);
                    field = comboBox;

                    break;
                case 'slider':
                    label = $('<span>').text(opt.name);

                    if (title) {
                        title.appendTo(itemContainer);
                    }
                    label.appendTo(itemContainer);
                    itemContainer.appendTo(centerPanelDomNode);

                    var slider = $('<div>').appendTo(itemContainer);

                    slider = new HorizontalSlider({
                        minimum: opt.min,
                        maximum: opt.max,
                        intermediateChanges: true,
                        style: 'width: 300px',
                        discreteValues: (opt.max - opt.min + 1),
                        value: fieldValue,
                        onChange: function (value) {
                            changed[fieldId] = value;
                        }
                    }, slider[0]);
                    field = slider;

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
                    var textbox = $('<input>');
                    label = $('<span>').text(opt.name);
                    var br = $('<br>');

                    if (title) {
                        title.appendTo(itemContainer);
                    }
                    label.appendTo(itemContainer);
                    textbox.appendTo(itemContainer);
                    br.appendTo(itemContainer);
                    itemContainer.appendTo(centerPanelDomNode);

                    var text = new TextBox({
                        value: fieldValue,
                        style: 'margin-top: 5px; margin-bottom: 5px; margin-left: 5px;',
                        onChange: function (value) {
                            changed[fieldId] = value;
                        }
                    }, textbox[0]);
                    field = text;
                    break;
                }
                if (opt.change) {
                    store.addFieldChangeListener(fieldId, opt.change);
                }
                if (opt.enabledOn) {
                    var cb; // checkbox
                    if ((cb = reg.byId(opt.enabledOn)) && cb.isInstanceOf(CheckBox)) {
                        field.set('disabled', !cb.get('value'));
                        aspect.after(cb, 'onChange', function (newVal) {
                            field.set('disabled', !newVal);
                        }, true);
                    } else {
                        throw new Error('No check-box option declared yet with that name "' + opt.enabledOn + '"');
                    }
                }

                return field;
            }

            // show preference view
            var pages = extpoint.getPagesList();
            var changed = {};

            var openingPage = '';
            var categoryItemClass = 'preferenceview-category-item';

            if (!showing) {
                showing = true;

                var preferenceDlg = new ButtonedDialog({
                    buttons: [
                        {
                            id: 'prefSaveButton',
                            caption: 'Save',
                            methodOnClick: 'savePref'
                        },
                        {
                            id: 'prefCencelButton',
                            caption: 'Cancel',
                            methodOnClick: 'resetPref'
                        }
                    ],
                    methodOnEnter: null,
                    defaultPref: function () {
                        changed = {};
                        openPage(openingPage, true);
                    },
                    resetPref: function () {
                        changed = {};
                        openPage(openingPage);
                        preferenceDlg.hide();
                    },
                    applyPref: function () {
                        store.updateValues(changed);
                    },
                    savePref: function () {
                        this.applyPref();
                        preferenceDlg.hide();
                    },

                    refocus: false,
                    title: 'Preferences',
                    style: 'width: 650px',

                    onHide: function () {
                        showing = false;
                        preferenceDlg.destroyRecursive();
                    }
                });
                preferenceDlg.setContentArea(markup + '\n <div id="prefDlgContent"></div>');
                var dlgContent = $('#prefDlgContent');

                var borderContainer = new BorderContainer({
                    style: 'width:100%; height:450px; background-color:transparent'
                }, dlgContent[0]);

                var leftPanel = new ContentPane({
                    style: 'width:150px; padding:1px; border-radius:3px; ' +
                        'background-color: #E8EDF2; border: 1px solid #9EA5AE',
                    region: 'left',
                    splitter: true
                });

                var innerleftPanel = new ContentPane({
                    style: 'width:100%; padding:1px; background-color: #FFFFFF; border: 1px solid #DADFE4'
                });

                var centerPanel = new ContentPane({
                    region: 'center',
                    style: 'padding:1px; border-radius:3px; background-color: #E8EDF2; border: 1px solid #9EA5AE'
                });

                var innerCenterPanel = new ContentPane({
                    style: 'box-sizing: border-box; width: 100%; height: calc(100% - 40px); ' +
                        'padding: 10px; background-color: #FFFFFF;'
                });
                var innerCenterBottomPanel = new ContentPane({
                    style: 'box-sizing: border-box; width: 100%; height: 40px; padding: 1px; background-color: #FFFFFF;'
                });

                leftPanel.addChild(innerleftPanel);
                centerPanel.addChild(innerCenterPanel);
                centerPanel.addChild(innerCenterBottomPanel);

                borderContainer.addChild(leftPanel);
                borderContainer.addChild(centerPanel);

                var btnDefaults = new Button({
                    label: 'Restore Defaults',
                    style: 'float: right',
                    onClick: function () {
                        preferenceDlg.defaultPref();
                    }
                });
                var btnApply = new Button({
                    label: 'Apply',
                    style: 'padding-right: 6px; float: right',
                    onClick: function () {
                        preferenceDlg.applyPref();
                    }
                });
                innerCenterBottomPanel.addChild(btnApply);
                innerCenterBottomPanel.addChild(btnDefaults);

                preferenceDlg.show();

                var centerPanelDomNode = innerCenterPanel.domNode;
                var stack = [];
                stack.push({
                    hierarchy: '',
                    childrenElem: innerleftPanel.domNode
                });
                _.each(pages, function (page, index) {
                    // not to show when "visible": "false"
                    if (page.visible === 'false') {
                        return false;
                    }

                    function augpath(hierarchy) {
                        if (hierarchy === '') {
                            return '';
                        }
                        if (hierarchy.charAt(hierarchy.length - 1) !== '/') {
                            return hierarchy + '/';
                        }
                        return hierarchy;
                    }

                    var top = stack.pop();
                    while (page.hierarchy.indexOf(augpath(top.hierarchy)) !== 0) {
                        top = stack.pop();
                    }

                    var expandable = (index < pages.length - 1) &&
                        (pages[index + 1].hierarchy.indexOf(augpath(page.hierarchy)) === 0);

                    var title = $('<div class=' + categoryItemClass + '>');
                    var titleIcon = $('<span class="preferenceview-category-item__tree ' +
                                      (expandable ? 'collapsed' : '') + '">')
                        .appendTo(title);
                    titleIcon.hover(
                        function () { $(this).addClass('hover'); },
                        function () { $(this).removeClass('hover'); }
                    );
                    void $('<span>').text(page.name).appendTo(title);
                    title.appendTo(top.childrenElem);
                    var children = $('<div class="children">').appendTo(top.childrenElem);
                    title.attr('hierarchy', page.hierarchy).css({
                        cursor: 'default'
                    });
                    children.css({
                        marginLeft: '20px',
                        display: 'none'
                    });

                    if (expandable) {
                        title.click(function (e) {
                            var offX  = BrowserUtil.getOffsetX(e);
                            if (offX < 20) {
                                if (title.expanded) {
                                    title.expanded = false;
                                    titleIcon.removeClass('expanded');
                                    titleIcon.addClass('collapsed');
                                    children.css({
                                        display: 'none'
                                    });
                                } else {
                                    title.expanded = true;
                                    titleIcon.removeClass('collapsed');
                                    titleIcon.addClass('expanded');
                                    children.css({
                                        display: ''
                                    });
                                }
                            }
                            return false;
                        });
                    }

                    stack.push(top);
                    stack.push({
                        hierarchy: page.hierarchy,
                        childrenElem: children
                    });
                });

                $('.' + categoryItemClass).click(function () {
                    openPage($(this).attr('hierarchy'));
                });

                if (pages.length > 0) {
                    var page = pages[0];
                    openPage(page.hierarchy);
                }
            }
        }
    };
});
