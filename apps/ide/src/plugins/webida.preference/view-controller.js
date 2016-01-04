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
 * @file Controller for the preference dialog view
 * @since 1.4.0
 * @author kyungmi.k@samsung.com
 */

define([
    'dijit/registry',
    'dojo/i18n!./nls/resource',
    'dojo/on',
    'dojo/string',
    'external/lodash/lodash.min',
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    './preference-manager',
    './preference-store',
    './tree-view-controller',
    'text!./layout/preferences.html',
    'xstyle/css!./style/style.css'
], function (
    reg,
    i18n,
    on,
    string,
    _,
    Locale,
    Logger,
    notify,
    ButtonedDialog,
    preferenceManager,
    Store,
    treeViewController,
    template
) {
    'use strict';
    var logger = new Logger();

    var module = {};
    var preferenceDlg;
    var preferenceExts;
    var currentPage;

    var treeArea;
    var subContentArea;
    var titleArea;
    var scope;
    var scopeInfo;
    var invalidStores = [];

    var locale = new Locale(i18n);

    var PAGE_CLASS = {
        DefaultPage: 'plugins/webida.preference/pages/PreferencePage',
        SimplePage: 'plugins/webida.preference/pages/SimplePage'
    };

    var onChangingPage = false;

    /* jshint validthis: true */
    function _onStoreStatusChanged(status) {
        reg.byId('restore-preference').set('disabled', !currentPage.store.status.override);
        if (currentPage.store.status.dirty) {
            reg.byId('apply-preference').set('disabled', !currentPage.store.status.valid);
        } else {
            reg.byId('apply-preference').set('disabled', true);
        }
        if (status) {
            if (status.override !== undefined) {
                reg.byId('preference-override').set('checked', status.override);
            }
            if (status.valid !== undefined) {
                if (!status.valid) {
                    invalidStores.push(this);
                } else {
                    var index = invalidStores.indexOf(this);
                    if (index > -1) {
                        invalidStores.splice(index, 1);
                    }
                }
                reg.byId('save-all-preference').set('disabled', invalidStores.length > 0);
            }
        }
    }

    function _onChangeTreeSelection(node) {
        if (!onChangingPage) {
            onChangingPage = true;
            treeViewController.blockTreeSelection(true);
            // get preference store
            var store = preferenceManager.getStore(node.id, scope, scopeInfo);
            // get extension's meta
            var extension = _.find(preferenceExts, {id: node.id});
            // guess page class module
            var pageModule = PAGE_CLASS[extension.page] ?
                PAGE_CLASS[extension.page] :
                (extension.module + '/' + extension.page);

            // clear and redraw content area
            if (currentPage) {
                currentPage.store.off(Store.STATUS_CHANGED, _onStoreStatusChanged);
                currentPage.onPageRemoved();
                currentPage = undefined;
            }
            $(subContentArea).empty();

            require([extension.module, pageModule], function (module, Page) {
                var pageData;
                if (module && extension.pageData && typeof module[extension.pageData] === 'function') {
                    pageData = module[extension.pageData]();
                }
                currentPage = new Page(store, pageData);
                currentPage.store.on(Store.STATUS_CHANGED, _onStoreStatusChanged);
                _onStoreStatusChanged();
                _initializeContentArea(node, store);
                subContentArea.appendChild(currentPage.getPage());
                currentPage.onPageAppended();
                onChangingPage = false;
                treeViewController.blockTreeSelection(false);
            });
        }
    }

    function _initializeContentArea(node, store) {

        function __dim(override) {
            if (!$('.preference-override-box').hasClass('hidden')) {
                if (!override) {
                    if ($(subContentArea).find('.dim').length === 0) {
                        $(subContentArea).append($('<div class="dim"></div>'));
                    }
                } else {
                    $(subContentArea).find('.dim').remove();
                }
            }
        }

        var overrideCheckbox = reg.byId('preference-override');
        $(titleArea).find('h1').text(node.name);
        if (preferenceManager.getParentStore(store)) {
            $('.preference-override-box').removeClass('hidden');
            overrideCheckbox.set('checked', store.status.override, false);
            __dim(store.status.override);
        } else {
            $('.preference-override-box').addClass('hidden');
        }

        // events
        preferenceDlg.own(
            on(overrideCheckbox, 'change', function (checked) {
                currentPage.store.setOverride(checked);
                __dim(checked);
            })
        );

    }

    function _initializeLayout() {
        preferenceDlg.setContentArea(template);
        locale.convertMessage(preferenceDlg.domNode);
        treeArea = preferenceDlg.domNode.getElementsByClassName('preferenceview-tree')[0];
        subContentArea = preferenceDlg.domNode.getElementsByClassName('preferenceview-sub-content')[0];
        titleArea = preferenceDlg.domNode.getElementsByClassName('preferenceview-content-title')[0];
    }

    function _initializeTreeView() {
        preferenceExts = preferenceManager.getAllPreferenceTypes(scope);
        treeViewController.addSelectionChangedListener(_onChangeTreeSelection);

        // append tree page to the area for tree except all `hidden` preferences
        treeArea.appendChild(treeViewController.getPage(_.reject(preferenceExts, {hidden: true})));
        treeViewController.onPageAppended();
    }

    module.isOpened = false;

    module.openDialog = function (thisScope, info) {
        scope = thisScope;
        scopeInfo = info;
        if (!module.isOpened) {
            preferenceDlg = new ButtonedDialog({
                buttons: [
                    {
                        id: 'save-all-preference',
                        caption: i18n.labelSave,
                        methodOnClick: 'saveClose'
                    },
                    {
                        caption: i18n.labelCancel,
                        methodOnClick: 'cancelClose'
                    }
                ],
                refocus: false,
                title: locale.formatMessage('titleDialog', {scopeName: scope.displayName}),
                style: 'width: 650px',
                methodOnEnter: null,
                saveClose: function () {
                    preferenceManager.saveAllPreference(scope, function (invalidMessages) {
                        if (invalidMessages.trim()) {
                            notify.warning(invalidMessages);
                        }
                        preferenceDlg.hide();
                    });
                },
                cancelClose: function () {
                    preferenceDlg.hide();
                },
                onHide: function () {
                    treeViewController.removeSelectionChangedListener(_onChangeTreeSelection);
                    treeViewController.onPageRemoved();
                    preferenceDlg.destroyRecursive();
                    preferenceManager.flushPreference(scope, scopeInfo, function (err) {
                        if (err) {
                            notify.error(err);
                        }
                        module.isOpened = false;
                        preferenceManager.undoAllChanges(scope, scopeInfo);
                    });
                }
            });
            module.isOpened = true;
            try {
                _initializeLayout();
                _initializeTreeView();
                // add listener for Restore default and Apply button
                preferenceDlg.own(
                    on($('#restore-preference').get(0), 'click', function () {
                        currentPage.store.restore();
                        currentPage.reload();
                    }),
                    on($('#apply-preference').get(0), 'click', function () {
                        currentPage.store.apply(function (invalidMessage) {
                            if (invalidMessage) {
                                notify.warning(invalidMessage);
                            }
                        });
                    })
                );
                preferenceDlg.show();
            } catch (e) {
                logger.error(e);
                preferenceDlg.onHide();
                module.isOpened = false;
            }
        }
    };

    return module;
});
