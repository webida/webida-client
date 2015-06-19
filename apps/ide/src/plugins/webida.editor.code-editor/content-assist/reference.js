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

define(['other-lib/underscore/lodash.min'],
function (_) {

    'use strict';

    var _referTos = {}; // A refer B
    var _referFroms = {}; // B referred from A


    var reference = {};

    reference.addReference = function (from, to) {
        _referTos[from] = _.union(_referTos[from], [to]);
        _referFroms[to] = _.union(_referFroms[to], [from]);
    };

    reference.removeReference = function (from, to) {
        _referTos[from] = _.without(_referTos[from], to);
        _referFroms[to] = _.without(_referFroms[to], from);
    };

    reference.removeReferences = function (from) {
        var tos = _referTos[from];
        _referTos[from] = [];
        _.each(tos, function (to) {
            _referFroms[to] = _.without(_referFroms[to], from);
        });
    };

    reference.getReferenceFroms = function (to) {
        return _referFroms[to];
    };

    reference.getReferenceTos = function (from) {
        return _referTos[from];
    };

    return reference;
});
