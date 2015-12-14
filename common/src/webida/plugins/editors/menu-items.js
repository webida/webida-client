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
    'dojo/i18n!./nls/resource'
], function(
    i18n
) {
    'use strict';

    var menuItems = {
        fileMenuItems: {
            '&Save': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'saveFile'],
            'Sav&e All': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'saveAll'],
            '&Close': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'closeCurrent'],
            'Cl&ose Others': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'closeOthers'],
            'C&lose All': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'closeAll'],
            'Recent Files': ['enum', 'webida-lib/plugins/editors/editors-commands', 'openRecentFile'],
        },
        editMenuItems: {
            '&Undo': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'undo'],
            '&Redo': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'redo'],
            '&Delete': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'del'],
            'Select &All': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'selectAll'],
            'Select L&ine': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'selectLine'],
            '&Line': {
                '&Indent': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineIndent'],
                '&Dedent': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineDedent'],
                'Move Line U&p': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineMoveUp'],
                'Move Line Dow&n': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineMoveDown'],
                'D&elete Lines': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineDelete'],
                'Move Cursor Line to Middle': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'cursorLineToMiddle'],
                'Move Cursor Line to Top': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'cursorLineToTop'],
                'Move Cursor Line to Bottom': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'cursorLineToBottom'],
            },
            '&Source': {
                '&Toggle Line Comments': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'lineComment'],
                'Toggle Block Comment': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'blockComment'],
                'Comment Out Selection': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'commentOutSelection'],
                '&Fold': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'foldCode'],
                '&Beautify': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'beautifyCode'],
                'B&eautify All': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'beautifyAllCode'],
                '&Rename Variables': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'rename'],
            }
        },
        findMenuItems: {
            '&Replace': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'replace'],
            'F&ind': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'find'],
            '&Highlight to Find': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'quickFind'],
            'Find &Next': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'findNext'],
            'Find &Previous': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'findPrev'],
        },
        navMenuItems: {
            '&Go to Definition': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'gotoDefinition'],
            'G&o to Line': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'gotoLine'],
            'Go to &Matching Brace': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'gotoMatchingBrace'],
            '&Navigate Editors': {
                '&Ex-Selected Tab': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'switchEditorTabToExSelected'],
                '&Previous Tab': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'goPrevTab'],
                '&Next Tab': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'goNextTab'],
                '&Select Tab from List': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'switchEditorTab'],
                'Switch &Tab Container': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'focusMoveToNextTabContainer'],
                'Move Tab to &Other Container': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'moveToOtherTabContainer'],
            }
        },
        viewMenuItems: {
            'Spl&it Editors': {
                '&Vertical': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'rotateToHorizontal'],
                '&Horizontal': ['cmnd', 'webida-lib/plugins/editors/editors-commands', 'rotateToVertical'],
            }
        }
    };

    menuItems.fileMenuItems['Cl&ose Others'].alternateLabel = i18n.fileMenuCloseOthers;
    menuItems.fileMenuItems['C&lose All'].alternateLabel = i18n.fileMenuCloseAll;
    menuItems.fileMenuItems['&Save'].alternateLabel = i18n.fileMenuSave;
    menuItems.editMenuItems['&Undo'].alternateLabel = i18n.editMenuUndo;
    menuItems.editMenuItems['&Redo'].alternateLabel = i18n.editMenuRedo;
    menuItems.editMenuItems['&Delete'].alternateLabel = i18n.editMenuDelete;
    menuItems.editMenuItems['Select &All'].alternateLabel = i18n.editMenuSelectAll;
    menuItems.editMenuItems['Select L&ine'].alternateLabel = i18n.editMenuSelectLine;
    menuItems.editMenuItems['&Line'].alternateLabel = i18n.editMenuLine;
    menuItems.editMenuItems['&Line']['&Indent'].alternateLabel = i18n.editMenuLineIndent;
    menuItems.editMenuItems['&Line']['&Dedent'].alternateLabel = i18n.editMenuLineDedent;
    menuItems.editMenuItems['&Line']['Move Line U&p'].alternateLabel = i18n.editMenuLineMoveLineUp;
    menuItems.editMenuItems['&Line']['Move Line Dow&n'].alternateLabel = i18n.editMenuLineMoveLineDown;
    menuItems.editMenuItems['&Line']['D&elete Lines'].alternateLabel = i18n.editMenuLineDeleteLines;
    menuItems.editMenuItems['&Line']['Move Cursor Line to Middle'].alternateLabel = i18n.editMenuLineMoveCursorLineToMiddle;
    menuItems.editMenuItems['&Line']['Move Cursor Line to Top'].alternateLabel = i18n.editMenuLineMoveCursorLineToTop;
    menuItems.editMenuItems['&Line']['Move Cursor Line to Bottom'].alternateLabel = i18n.editMenuLineMoveCursorLineToBottom;
    menuItems.editMenuItems['&Source'].alternateLabel = i18n.editMenuSource;
    menuItems.editMenuItems['&Source']['&Fold'].alternateLabel = i18n.editMenuSourceFold;
    menuItems.editMenuItems['&Source']['&Toggle Line Comments'].alternateLabel = i18n.editMenuSourceToggleLineComments;
    menuItems.editMenuItems['&Source']['Toggle Block Comment'].alternateLabel = i18n.editMenuSourceToggleBlockComment;
    menuItems.editMenuItems['&Source']['Comment Out Selection'].alternateLabel = i18n.editMenuSourceCommentOutSelection;
    menuItems.editMenuItems['&Source']['&Beautify'].alternateLabel = i18n.editMenuSourceBeautify;
    menuItems.editMenuItems['&Source']['B&eautify All'].alternateLabel = i18n.editMenuSourceBeautifyAll;
    menuItems.editMenuItems['&Source']['&Rename Variables'].alternateLabel = i18n.editMenuSourceRenameVariables;
    menuItems.navMenuItems['&Go to Definition'].alternateLabel = i18n.navMenuGotoDefinition;
    menuItems.navMenuItems['G&o to Line'].alternateLabel = i18n.navMenuGotoLine;
    menuItems.navMenuItems['Go to &Matching Brace'].alternateLabel = i18n.navMenuGotoMatchingBrace;

    return menuItems;
});
