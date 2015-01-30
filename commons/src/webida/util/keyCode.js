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

define([],
function () {
    'use strict';

    var keyToCodeMap = {    // from Flanagan's book
        // Keys with words or arrows on them
        'Backspace': 8,
        'Tab': 9,
        'Enter': 13,
        'Shift': 16,
        'Ctrl': 17,
        'Alt': 18,
        'Pause': 19,
        'CapsLock': 20,
        'Esc': 27,
        'Space': 32,
        'PageUp': 33,
        'PageDown': 34,
        'End': 35,
        'Home': 36,
        'Left': 37,
        'Up': 38,
        'Right': 39,
        'Down': 40,
        'Insert': 45,
        'Delete': 46,

        // Number keys on main keyboard (not keypad)
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,

        // Letter keys. Note that we don't distinguish upper and lower case
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,


        // Keypad numbers and punctuation keys. (Opera does not support these.)
        /*
        '0': 96,
        '1': 97,
        '2': 98,
        '3': 99,
        '4': 100,
        '5': 101,
        '6': 102,
        '7': 103,
        '8': 104,
        '9': 105,
        'Multiply': 106,
        'Add': 107,
        'Subtract': 109,
        'Decimal': 110,
        'Divide': 111,
         */

        // Function keys
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'F13': 124,
        'F14': 125,
        'F15': 126,
        'F16': 127,
        'F17': 128,
        'F18': 129,
        'F19': 130,
        'F20': 131,
        'F21': 132,
        'F22': 133,
        'F23': 134,
        'F24': 135,

        // Punctuation keys that don't require holding down Shift
        // Hyphen is nonportable: FF returns same code as Subtract
        //';': 59, '=': 61, ';': 186, '=': 187, // Firefox and Opera return 59,61
        '-': 189,
        ',': 188,
        '.': 190,
        '/': 191,
        '`': 192,
        '[': 219,
        '\\': 220,
        ']': 221,
        '\'': 222
    };

    var codeToKeyMap = (function () {
        var ret = [];
        Object.keys(keyToCodeMap).forEach(function (key) {
            if (ret[keyToCodeMap[key]]) {
                throw new Error('Error: Duplicate code ' + keyToCodeMap[key] + ' for two keys ' +
                                key + ' and ' + ret[keyToCodeMap[key]]);
            } else {
                ret[keyToCodeMap[key]] = key;
            }
        });
        return ret;
    })();
    //console.debug(codeToKeyMap);

    return {
        keyToCodeMap: keyToCodeMap,
        codeToKeyMap: codeToKeyMap
    };
});
