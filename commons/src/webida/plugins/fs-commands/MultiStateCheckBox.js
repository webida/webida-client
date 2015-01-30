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
 * webida - MultiStateCheckBox.js
 *
 */

define(['dojo',
        'dojo/_base/declare',
        'dojo/_base/event',
        'dijit/form/CheckBox',
         'dojo/dom-attr'
       ],
function (dojo,
          declare,
          event,
          CheckBox,
          domAttr
         )
{
    'use strict';

    var _MultiStateCheckBox = declare([CheckBox], {

        toggleState: {'partial': true, 'checked': false, 'unchecked': true},

        _setCheckedAttr: function (checked, priorityChange) {
            var newState = checked,
                txtState;

            txtState = (newState === 'partial' ? newState : (newState ? 'true' : 'false'));

            this._set('checked', newState);
            domAttr.set(this.focusNode || this.domNode, 'checked', newState);
            (this.focusNode || this.domNode).setAttribute('txt-checked', txtState);
            this._handleOnChange(newState, priorityChange);
            return newState;
        },

        toggle: function () {
            var curState = this.get('checked');
            var nxtState;

            if (!this.readOnly && !this.disabled) {
                nxtState = this.toggleState[curState.toString()];
                curState = this._setCheckedAttr((!!nxtState ? nxtState : true));
            }
            return curState;
        },

        _onClick: function (evt) {
            if (!this.readOnly && !this.disabled) {
                this.toggle();
                return this.onClick(evt);
            }
            return event.stop(evt);
        },
    });

    return _MultiStateCheckBox;
});
