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


function openDlg() {
    // default size, pixels unit
    var width = 400;
    var height = 200;

    // center position
    var x = window.innerWidth / 2 - width / 2;
    var y = window.innerHeight / 2 - height / 2;

    // setting options
    var options = "width=" + width +
        ",height=" + height +
        ",modal=yes,alwaysRaised=yes," +
        "left=" + x + ',' +
        "top=" + y;
    var sharedObject = {pWin: window};
    if(!window.dlg) {
        window.dlg = window.open("about.html", null, options, null);
        window.dlg.dialogArguments = sharedObject;

        window.dlg.addEventListener("beforeunload", function(e){
            this.dialogArguments.pWin.dlg = null;
        }, false);
    } else {
        window.dlg.focus();
    }
}
