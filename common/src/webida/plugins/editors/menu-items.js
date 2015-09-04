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

define([], function () {
    'use strict';

    var fileMenuItems = {
        '&Save' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'saveFile' ],
        'Sav&e All' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'saveAllFiles' ],
        '&Close' : [ 'cmnd', 'webida-lib/plugins/editors/plugin', 'closeFile' ],
        'Cl&ose Others' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'closeOtherFiles' ],
        'C&lose All' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'closeAllFiles' ],
        'Recent Files' : [ 'enum', 'webida-lib/plugins/editors/editors-commands', 'openRecentFile' ],
    };

    var editMenuItems = {
        '&Undo' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'undo' ],
        '&Redo' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'redo' ],
        '&Delete' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'del' ],
        'Select &All' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'selectAll' ],
        'Select L&ine' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'selectLine' ],
        '&Line' : {
            '&Indent' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineIndent' ],
            '&Dedent' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineDedent' ],
            'Move Line U&p' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineMoveUp' ],
            'Move Line Dow&n' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineMoveDown' ],
            'D&elete Lines' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineDelete' ],
            'Move Cursor Line to Middle' : [ 'cmnd',
                                             'webida-lib/plugins/editors/editors-commands', 'cursorLineToMiddle' ],
            'Move Cursor Line to Top' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'cursorLineToTop' ],
            'Move Cursor Line to Bottom' : [ 'cmnd',
                                             'webida-lib/plugins/editors/editors-commands', 'cursorLineToBottom' ],
        },
        '&Source' : {
            '&Toggle Line Comments' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineComment' ],
            'Toggle Block Comment' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'blockComment' ],
            'Comment Out Selection' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'commentOutSelection' ],
            '&Fold' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'foldCode' ],
            '&Beautify' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'beautifyCode' ],
            'B&eautify All' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'beautifyAllCode' ],
            '&Rename Variables' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'rename' ],
        }
    };

    var findMenuItems = {
        '&Replace': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'replace'],
        'F&ind': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'find'],
        '&Highlight to Find': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'quickFind'],
        'Find &Next': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'findNext'],
        'Find &Previous': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'findPrev'],
    };

    var navMenuItems = {
        '&Go to Definition' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'gotoDefinition' ],
        'G&o to Line' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'gotoLine' ],
        'Go to &Matching Brace' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'gotoMatchingBrace' ],
        '&Navigate Editors' : {
            '&Ex-Selected Tab' : [ 'cmnd',
                                   'webida-lib/plugins/editors/editors-commands', 'switchEditorTabToExSelected' ],
            '&Previous Tab' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'goPrevTab' ],
            '&Next Tab' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'goNextTab' ],
            '&Select Tab from List' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'switchEditorTab' ],
            'Switch &Tab Container' : [ 'cmnd',
                                        'webida-lib/plugins/editors/editors-commands', 'focusMoveToNextTabContainer' ],
            'Move Tab to &Other Container' : [ 'cmnd',
                                               'webida-lib/plugins/editors/editors-commands',
                                               'moveToOtherTabContainer' ],
        }
    };

    var viewMenuItems = {
        'Spl&it Editors' : {
            '&Vertical' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'rotateToVertical' ],
            '&Horizontal' : [ 'cmnd', 'webida-lib/plugins/editors/editors-commands', 'rotateToHorizontal' ],
        }
    };

    return {
        fileMenuItems: fileMenuItems,
        editMenuItems: editMenuItems,
        findMenuItems: findMenuItems,
        navMenuItems: navMenuItems,
        viewMenuItems: viewMenuItems
    };
});
