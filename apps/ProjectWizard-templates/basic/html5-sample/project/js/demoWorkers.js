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

/*
 * demo watch
 */
function demoTime() {
    var date = new Date();
    
    var ampm;
    var hour = date.getHours();
    if(hour > 12 && hour < 24) {
        ampm = 'pm';
        hour = hour - 12;
    } else {
        ampm = 'am';
        if(hour === 24) {
            hour = 12;
        }
    }

    var min = date.getMinutes();
    var sec = date.getSeconds();

    var data = {
        ampm: ampm,
        hour: hour,
        min: min,
        sec: sec
    };
    postMessage(data);
    
    console.log('demoworker....');
    setTimeout(demoTime, 500);
}

demoTime();
