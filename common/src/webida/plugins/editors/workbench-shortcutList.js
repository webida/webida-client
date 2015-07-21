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

define(['./plugin',
        'external/codemirror/lib/codemirror',
        'external/lodash/lodash.min'
], function (editors, codeMirror, _) {
    'use strict';

    function getEnclosingDOMElem() {
        return document.getElementById('editor');
    }

    function getShortcuts() {
        var desc = {
            //'selectAll': 'Select all text',		registered in Command&Menu System
            'indentAuto': 'Indent auto',
            //'indentMore': 'Indent',		registered in Command&Menu System
            //'indentLess': 'Dedent',		registered in Command&Menu System
            'goDocStart': 'Go to the beginning of the document',
            'goDocEnd': 'Go to the end of the document',
            'goGroupLeft': 'Move backward word',
            'goGroupRight': 'Move forward word',
            'goLineStart': 'Go to the beginning of the line',
            'goLineStartSmart': 'Go to the first word (or column) of the line',
            //'goLineEnd': 'Go to the end of the line', // trivial
            //'goPageUp': 'Move page up', // trivial
            //'goPageDown': 'Move page down', // trivial
            //'gotoLine' : 'Go to line', // registered in Command&Menu System
            //'undo' : 'Undo', // registered in Command&Menu System
            //'redo' : 'Redo', // registered in Command&Menu System
            'scrollUp' : 'Scroll up',
            'scrollDown' : 'Scroll down',
            //'save' : 'Save', // registered in Command&Menu System
            'find' : 'Find',
            'findNext' : 'Find next',
            'findPrev' : 'Find prev',
            'replace' : 'Replace',
            'replaceAll' : 'Replace all',
            //'handleTab' : 'Handle tab', // trivial
            //'linecomment' : 'Line comment', // registered in Command&Menu System
            'newlineAndIndent' : 'New line and indent',
            //'goCharLeft' : 'One character left', // trivial
            //'goCharRight' : 'One character right', // trivial
            //'goLineUp' : 'One line up', // trivial
            //'goLineDown' : 'One line down', // trivial
            'navigateSnippetBackward' : 'Navigate snippet backward',
            //'toggleOverwrite' : 'Toggle overwrite', // trivial
            'autocomplete' : 'Auto complete',
            'foldselection': 'Fold selected area',
            //'delCharAfter': 'Delete forward', // trivial
            //'delCharBefore': 'Delete backword',		trivial
            'delGroupAfter': 'Delete forward word',
            'delGroupBefore': 'Delete backward word',
            'insertsofttab': 'Tab',
            'tern-autocomplete': 'JavaScript auto completion',
            'tern-showreference': 'JavaScript show occurences',
            'tern-showtype': 'JavaScript show type of variable',
            'tern-gotodefinition': 'JavaScript go to definition',
            'tern-jumpback': 'JavaScript jump back to the reference',
            'tern-rename': 'JavaScript rename variable',

            // emmet shortcuts. see webida.editor.text-editor/emmet.js
            'emmet.expand_abbreviation': 'Expand abbreviation',
            'emmet.expand_abbreviation_with_tab': 'Expand abbreviation with tab',
            'emmet.match_pair_outward': 'Match pair outward',
            'emmet.match_pair_inward': 'Match pair inward',
            'emmet.matching_pair': 'Matching pair',
            'emmet.wrap_with_abbreviation': 'Wrap with abbreviation',
            'emmet.next_edit_point': 'Next edit point',
            'emmet.prev_edit_point': 'Prev edit point',
            //'emmet.select_line': 'Select line', // registered in Command&Menu System
            'emmet.merge_lines': 'Merge lines',
            'emmet.toggle_comment': 'Toggle comment',
            'emmet.split_join_tag': 'Split join tag',
            'emmet.remove_tag': 'Remove tag',
            'emmet.evaluate_math_expression': 'Evaluate math expression',
            'emmet.increment_number_by_1': 'Increment number by 1',
            'emmet.decrement_number_by_1': 'Decrement number by 1',
            'emmet.increment_number_by_01': 'Increment number by 01',
            'emmet.decrement_number_by_01': 'Decrement number by 01',
            'emmet.increment_number_by_10': 'Increment number by 10',
            'emmet.decrement_number_by_10': 'Decrement number by 10',
            'emmet.select_next_item': 'Select next item',
            'emmet.select_previous_item': 'Select previous item',
            'emmet.reflect_css_value': 'Reflect css value',
            'emmet.insert_formatted_line_break_only': 'Insert formatted line break only'
        };
        if (editors && editors.currentFile && editors.currentFile.viewer && editors.currentFile.viewer.editor) {
            var viewer = editors.currentFile.viewer;
            return viewer.getWorkbenchShortcuts(desc);
            
        } else {
            return [];
        }
    }

    return {
        getEnclosingDOMElem: getEnclosingDOMElem,
        getShortcuts: getShortcuts
    };
});
