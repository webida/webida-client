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

    var template =
        '    <style> ' +
        '        #FileSelectionTree<%id-postfix%> ' +
        '        { ' +
        '            width: 390px; ' +
        '            height: 490px; ' +
        '        } ' +
        '        .selDirSelectedExpanded' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_folderopen.png");' +
        '            background-position: 0, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selDirDeselectedExpanded' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_folderopen.png");' +
        '            background-position: -32px, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selDirPartialExpanded' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_folderopen.png");' +
        '            background-position: -16px, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selDirSelectedCollapsed' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_folder.png");' +
        '            background-position: 0, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selDirDeselectedCollapsed' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_folder.png");' +
        '            background-position: -32px, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selDirPartialCollapsed' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_folder.png");' +
        '            background-position: -16px, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selFileSelected' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_file.png");' +
        '            background-position: 0, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .selFileDeselected' +
        '        { ' +
        '            background-image: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/select_state_file.png");' +
        '            background-position: -16px, 0;' +
        '            background-repeat: no-repeat;' +
        '            width: 16px;' +
        '            height: 16px;' +
        '        }' +
        '        .fileIcon' +
        '        { background: url("//<%webida-host%>/common/src/webida/' +
        'widgets/dialogs/file-selection/icons/fileIcon.png") no-repeat; width: 16px; height: 16px; }' +
        '    </style> ' +
        '    <div class="dijitDialogPaneContentArea">' +
        '        <div id="FileSelectionTree<%id-postfix%>"> </div>' +
        '    </div>';

    return template;
});
