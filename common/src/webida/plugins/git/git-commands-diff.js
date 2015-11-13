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
    'dojo/Deferred',
    'dojo/i18n!./nls/resource',
    'dojo/string',
    'dijit/registry',
    'external/async/dist/async.min',
    'plugins/webida.preference/preference-service-factory',
    'require',
    'webida-lib/app',
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    './git-core',
    './gitview-log',
    './lib/jsdifflib/diffview',
    './lib/jsdifflib/difflib',
    './preference-git'
], function (
    Deferred,
    i18n,
    string,
    registry,
    async,
    PreferenceFactory,
    require,
    ide,
    notify,
    ButtonedDialog,
    git,
    gitviewlog,
    diffview,
    difflib,
    GitPreferences
) {
    'use strict';

    var fsCache = ide.getFSCache();
    var preferences = PreferenceFactory.get('WORKSPACE');
    // constructor
    var GitDiff = function () {
    };

    GitDiff.prototype._getLinesOfContext = function () {
        var linesOfContext = preferences.getValue(GitPreferences.PREFIX,
                GitPreferences.getKey(GitPreferences.LINES_OF_CONTEXT));
        return linesOfContext || 10;
    };

    GitDiff.prototype.execute = function (gitRootPath, file, commitId) {
        var self = this;
        var ARG_LEN = arguments.length;

        require(['text!./layer/diff.html'], function (diffView) {
            diffView = diffView.replace('%WEBIDA-LIB%', require.toUrl('webida-lib'));
            var GIT_DIR = gitRootPath;
            var srcPath = GIT_DIR + file;
            var CUR_REVISION_TEXT;
            var HEAD_TEXT;
            var STR_CUR_REVISION_TEXT = ARG_LEN > 2 ? commitId : i18n.CurrentRevision;
            var STR_HEAD_TEXT = ARG_LEN > 2 ? commitId + '^' : i18n.head;
            var sm;
            var opcodes;
            var diffDlg = new ButtonedDialog({
                buttons: [{
                    caption: i18n.close,
                    methodOnClick: 'hide'
                }],
                methodOnEnter: 'hide',

                title: i18n.diff + GIT_DIR + file,
                style: 'width: 70%;',
                onHide: function () {
                    diffDlg.destroyRecursive();
                }
            });
            diffDlg.setContentArea(diffView);

            var diffoutput = $('#GitDiffInfo');
            var sidebysideRadioBtn = registry.byId('GitDiffSidebySideRadioBtn');
            var viewType = 1; // default = 1 (unified mode);

            function renderDiffView(contextSize, viewType) {
                diffoutput.empty();

                var output = diffview.buildView({
                    baseTextLines: HEAD_TEXT,
                    newTextLines: CUR_REVISION_TEXT,
                    opcodes: opcodes,
                    baseTextName: STR_HEAD_TEXT,
                    newTextName: STR_CUR_REVISION_TEXT,
                    contextSize: contextSize,
                    viewType: viewType
                });

                diffoutput.append(output);
            }

            async.waterfall([
                function (next) {
                    fsCache.isDirectory(srcPath, function (err, isDirectory) {
                        if (err) {
                            next('ERROR: isDirectory - ' + err);
                        } else {
                            if (isDirectory) {
                                var infoMsg = string.substitute(i18n.directoryPath, {file: file});
                                notify.info(infoMsg, i18n.gitDiffInfo);

                                next('INFO');
                            } else {
                                next();
                            }
                        }
                    });
                },
                function (next) {
                    if (commitId) {
                        git.exec(GIT_DIR, ['show',  commitId + ':' + file], function (err, data) {
                            if (err) {
                                next('ERROR: git show - ' + err);
                            } else {
                                CUR_REVISION_TEXT = difflib.stringAsLines(data);
                                next();
                            }
                        });
                    } else {
                        fsCache.readFile(srcPath, function (err, data) {
                            if (err) {
                                next('ERROR: readFile - ' + err);
                            } else {
                                CUR_REVISION_TEXT = difflib.stringAsLines(data);
                                next();
                            }
                        });
                    }
                },
                function (next) {
                    if (commitId) {
                        git.exec(GIT_DIR, ['show',  commitId + '^:' + file], function (err, data) {
                            if (err) {
                                next('ERROR: git show - ' + err);
                            } else {
                                STR_HEAD_TEXT = commitId + '^';
                                HEAD_TEXT = difflib.stringAsLines(data);
                                next();
                            }
                        });
                    } else {
                        git.exec(GIT_DIR, ['show', 'HEAD:' + file], function (err, data) {
                            if (err) {
                                next('ERROR: show - ' + err);
                            } else {
                                STR_HEAD_TEXT = 'HEAD';
                                HEAD_TEXT = difflib.stringAsLines(data);
                                next();
                            }
                        });
                    }
                }
            ], function (err) {
                if (err) {
                    if (err.match(/^ERROR: .*/)) {
                        gitviewlog.error(GIT_DIR, 'diff', err);
                    }

                    diffDlg.destroyRecursive();
                } else {
                    sm = new difflib.SequenceMatcher(HEAD_TEXT, CUR_REVISION_TEXT);
                    /* jshint camelcase: false */
                    opcodes = sm.get_opcodes();
                    /* jshint camelcase: true*/

                    var output = diffview.buildView({
                        baseTextLines: HEAD_TEXT,
                        newTextLines: CUR_REVISION_TEXT,
                        opcodes: opcodes,
                        baseTextName: STR_HEAD_TEXT,
                        newTextName: STR_CUR_REVISION_TEXT,
                        contextSize: self._getLinesOfContext(),
                        viewType: viewType
                    });

                    diffoutput.append(output);
                    // scroll to top for all browsers
                    // e.g., Firefox seems to remember div overflow scroll position
                    //diffoutput.scrollTop(0);
                    diffoutput.animate({ scrollTop: 0 }, 500);
                    diffDlg.show();
                }
            });

            dojo.connect(sidebysideRadioBtn, 'onChange', function (value) {
                if (value) {
                    viewType = 0;
                    renderDiffView(self._getLinesOfContext(), viewType);
                } else {
                    viewType = 1;
                    renderDiffView(self._getLinesOfContext(), viewType);
                }
            });

            $('#GitDiffPreference').click(function () {
                require(['text!./layer/diff-preference.html'], function (tpl) {
                    var contextSelect;
                    var openDialog = function () {
                        var deferred = new Deferred();
                        var dlg = new ButtonedDialog({
                            selected: null,

                            buttons: [
                                { id: 'gdApply',
                                 caption: i18n.ok,
                                 methodOnClick: 'apply'
                                },
                                { id: 'gdClose',
                                 caption: i18n.close,
                                 methodOnClick: 'hide'
                                }
                            ],
                            methodOnEnter: 'hide',
                            title: i18n.diffPreferences,
                            refocus: false,

                            onHide: function () {
                                dlg.destroyRecursive();
                                return deferred.resolve(dlg.selected);
                            },

                            onLoad: function () {
                                contextSelect = registry.byId('GitDiffContextSelect');
                                contextSelect.set('value', self._getLinesOfContext());
                            },

                            apply: function () {
                                var changed = {};
                                this.selected =
                                    changed[GitPreferences.getKey(GitPreferences.LINES_OF_CONTEXT)] =
                                    contextSelect.get('value');
                                preferences.updateValues(changed);
                                dlg.hide();
                            }
                        });
                        dlg.set('doLayout', false);
                        dlg.setContentArea(tpl);
                        dlg.show();

                        return deferred.promise;
                    };
                    openDialog().then(function (selected) {
                        if (selected) {
                            renderDiffView(selected, viewType);
                        }
                    });
                });
            });
        });
    };

    return GitDiff;
});
