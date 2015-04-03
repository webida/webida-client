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

define(['require',
        'dojo/Deferred',
        'dojo/when',
        'dojo/promise/all',
        'other-lib/underscore/lodash.min',
        'webida-lib/plugins/workbench/preference-system/store',
        'webida-lib/util/keyCode',
        'other-lib/toastr/toastr'],
function (require, Deferred, when, all, _, prefStore, keyCode, toastr) {
    'use strict';

    var emptyArr = [];

    var menuedPlugins = [];

    function isTerminal(item) {
        return _.isArray(item);
    }

    function isNonterminal(item) {
        return _.isObject(item) && !isTerminal(item);
    }

    function isDelimeter(item) {
        return item === '---';
    }

    function isItem(item) {
        return isNonterminal(item) || isTerminal(item);
    }

    function hasInvalidAccelKeySigns(segment) {
        var arr = segment.split('&');
        var arrLen = arr.length;
        return (arrLen > 2) || (arr[arrLen - 1] === '');
    }

    function checkLocation(contr) {

        if (contr.location === null) {
            return null;	// OK. It can be null
        }

        var arr = contr.location.split('/');
        var arrLen = arr.length;

        if (arr[0] !== '' || arr[arrLen - 1] !== '') {
            return 'Plugin ' + contr.__plugin__.manifest.name +
                ' registered menu items with an invalid location:' +
                ' must start and end with slashes (/)';
        }

        arr = _.compact(arr);
        if (arr.some(hasInvalidAccelKeySigns)) {
            return 'Plugin ' + contr.__plugin__.manifest.name +
                ' registered menu items with an invalid location:' +
                ' an invalid accelerator key sign (&)';
        }

        return null;
    }

    var reservedWords = ['__invisible__', '__plugin__', 'alternateLabel'];
    var terminalItemTypes = ['cmnd', 'flag', 'enum', 'radio'];

    function addDelimTo(target) {
        var len, keys = Object.keys(target);
        if ((len = keys.length) > 0 && isItem(target[keys[len - 1]])) {
            var k = 0;
            while (('%delim%' + k) in target) {
                k++;
            }
            target['%delim%' + k] = '---';
        }
    }


    function addBoundaryDelimeters(items) {
        console.assert(isNonterminal(items));
        _.each(items, function (val) {
            if (isNonterminal(val)) {
                addBoundaryDelimeters(val);
            }
        });
        addDelimTo(items);
    }

    function checkWholeItems(contr) {

        function findBadItem(itemTree) {
            var ownKeys = Object.keys(itemTree);
            var ownKeysLen = ownKeys.length;
            for (var i = 0; i < ownKeysLen; i++) {
                var key = ownKeys[i];
                if (key === '') {
                    return '/<empty string>';
                }

                if (key.indexOf('/') > -1) {
                    return '/' + key + '(a slash in the item name)';
                }

                if (hasInvalidAccelKeySigns(key)) {
                    return '/' + key + '(an invalid accelerator key sign (&))';
                }

                if (reservedWords.indexOf(key) > -1) {
                    return '/' + key + '(using a reserved word "' + key + '")';
                }

                var item = itemTree[key];
                if (item !== '---') {  // '---' is the mark of delimeters
                    if (item === null || typeof item !== 'object') {
                        return '/' + key + '(not a non-null object)';
                    }

                    if (_.isArray(item)) {
                        if (terminalItemTypes.indexOf(item[0]) < 0) {
                            return '/' + key + '(invalid terminal item type: ' + item[0] + ')';
                        }

                        switch (item[0]) {
                        case 'cmnd':
                            var info = item[1];
                            if (info) {
                                if (info.shortcut) {
                                    var dfltKeys = info.shortcut.keys && info.shortcut.keys['default'];
                                    if (dfltKeys) {
                                        if (!normalizeKeysStr(dfltKeys)) {
                                            return '/' + key + '(an invalid shortcut key spec)';
                                        }
                                    } else {
                                        return '/' + key + '(default shortcut key is not specified)';
                                    }
                                }

                                if (info.toolbar) {
                                    if (!(info.toolbar.icons && info.toolbar.tooltip)) {
                                        return '/' + key +
                                            '(icons and tooltip are required for a toolbar)';
                                    }

                                    if (typeof info.toolbar.icons !== 'string') {
                                        return '/' + key +
                                            '(icons must be a path of a sprite image file)';
                                    }
                                }

                            }
                            break;
                            /* currently nothing to check in the following two cases
                        case 'flag':
                            break;
                        case 'enum':
                            break;
                        case 'radio':
                            break;
                             */
                        }
                    } else {
                        var badSubItem = findBadItem(item);
                        if (badSubItem) {
                            return '/' + key + badSubItem;
                        }
                    }
                }
            }

            return null;
        }

        if ((contr.wholeItems === null) || _.isArray(contr.wholeItems) ||
            (typeof contr.wholeItems !== 'object')) {
            return 'Plugin ' + contr.__plugin__.manifest.name +
                ' registers menu items with an invalid "wholeItems" property:' +
                ' It must be a non-null non-array object';
        }

        var badItem = findBadItem(contr.wholeItems);
        if (badItem) {
            return 'Plugin ' + contr.__plugin__.manifest.name +
                ' registers menu items with an invalid "wholeItems" property:' +
                ' Item ' + badItem + ' is invalid';
        }

        if (contr.location === null) {
            var ownKeys = Object.keys(contr.wholeItems);
            if (//ownKeys.length === 0 ||
                ownKeys.some(function (key) { return contr.wholeItems[key][0] !== 'cmnd'; })) {
                return 'Plugin ' + contr.__plugin__.manifest.name +
                   ' registers menu items with an invalid "wholeItems" property:' +
                   //' It can only have one or more command menu items';
                   ' It can only have command menu items';
            }
        }

        return null;
    }

    function checkEachContributor(contributors) {

        /* Things to check
             . existence of location and wholeItems
             . about locations
               . They must be null or, start and end with '/'
               . Every segment must meet the constraints of a menu item name (see below)
             . about wholeItems
               . Every property in the hierarchy must be a non-null object or an array.
               . Every property name in the hierarchy must meet the constraints of a menu item name
                 . It can have at most one '&'.
                 . It cannot end with '&'.
               . If location is null, then wholeItems must have at least one property, and
                 represent a level 1 tree with 'cmnd' terminals.
         */

        var i, errMsg, len = contributors.length;
        for (i = 0; i < len; i++) {
            var contr = contributors[i];
            //console.log('hina temp: contr.module = ' + contr.module);
            errMsg = checkLocation(contr) || checkWholeItems(contr);
            if (errMsg) {
                break;
            }
        }

        return errMsg;
    }

    function topologicalSortWithLocations(arr) {
        var arrLen = arr.length;
        for (var i = 0; i < arrLen - 1; i++) {
            var locI = arr[i].location;
            for (var j = i + 1; j < arrLen; j++) {
                if (locI === null) {
                    break;
                }

                var locJ = arr[j].location;
                if (locI !== locJ && locI.indexOf(locJ) === 0) {
                    // locJ is a strict prefix of locI.
                    var t = arr[j];
                    arr[j] = arr[i];
                    arr[i] = t;
                    locI = locJ;
                }
            }
        }
    }

    var keyToCodeMap = keyCode.keyToCodeMap;
    var codeToKeyMap = keyCode.codeToKeyMap;
    var modifierKeyCodes = [ keyToCodeMap.Shift, keyToCodeMap.Ctrl, keyToCodeMap.Alt ];

    var modKeyStr = ['SHIFT', 'META', 'CTRL', 'ALT'];
    function normalizeKeysStr(str) {

        if (!str) {
            return null;
        }

        var arr = str.split('+');
        var len = arr.length;

        if (len < 1) {
            return null;
        }

        arr = arr.map(function (elmt) { return elmt.trim(); });
        var last = arr[len - 1];
        if (last.length === 1) {
            last = last.toUpperCase();
        }
        if (!keyToCodeMap[last]) {
            return null;
        }

        arr = arr.slice(0, -1).map(function (elmt) { return elmt.toUpperCase(); }).sort();

        if (arr.every(function (elmt) { return modKeyStr.indexOf(elmt) > -1; })) {
            var arr2 = [];

            // the order of following if-clauses matters
            if (arr.indexOf('CTRL') > -1) {
                arr2.push('Ctrl');
            }
            if (arr.indexOf('SHIFT') > -1) {
                arr2.push('Shift');
            }
            if (arr.indexOf('ALT') > -1) {
                arr2.push('Alt');
            }
            if (arr.indexOf('META') > -1) {
                arr2.push('Meta');
            }
            arr2.push(last);
            return arr2.join('+');
        } else {
            return null;
        }
    }

    function collectShortcutItems(wholeShortcutItems, item, curPath) {
        if (isTerminal(item)) {
            var shortcutSpec;
            curPath = curPath.substr(0, curPath.length - 1);
            if (item[0] === 'cmnd' && item[1] && (shortcutSpec = item[1].shortcut)) {
                var keys = normalizeKeysStr(shortcutSpec.keys);
                        // TODO: handle non-default cases according to the host-OS
                var scItems;
                if ((scItems = wholeShortcutItems[keys])) {
                    return 'A shortcut "' + keys +
                        '" is bound to two different menu items "' +
                        curPath + '" and "' + scItems[0].path + '"';
                }

                wholeShortcutItems[keys] = [];
                wholeShortcutItems[keys].push({path: curPath,
                                  keepDefault : shortcutSpec.keepDefault,
                                  propagate : shortcutSpec.propagate,
                                  skipInvoc : shortcutSpec.skipInvoc,
                                 });
            }
        } else if (isNonterminal(item)) {
            var ownKeys = Object.keys(item);
            var len = ownKeys.length;
            for (var i = 0; i < len; i++) {
                var key = ownKeys[i];
                var errMsg = collectShortcutItems(wholeShortcutItems, item[key], curPath + key + '/');
                if (errMsg) {
                    return errMsg;
                }
            }
        }

        return null;
    }


    function accumulateContributions(accum, contributors, whole) {

        var INVISIBLE_KEY = '__invisible__';
        var INVISIBLE_BRANCH = '/' + INVISIBLE_KEY + '/';
        function getInvisibleLocation(i) {
            return (INVISIBLE_BRANCH + 'i' + i + '/');
        }
        function isVisibleLocation(loc) {
            return loc.indexOf(INVISIBLE_BRANCH) !== 0;
        }

        function getTargetItemAtLocation(location) {
            var locSegments = _.compact(location.split('/'));

            // get target based on the location
            var loc = '/', locItem = accum;
            locSegments.forEach(function (locSegment) {
                loc += (locSegment + '/');
                var next = locItem[locSegment];

                if (next) {
                    if (!isNonterminal(next)) {
                        throw ' tried to register a menu item under an illegal location "' + loc +
                            (next.__plugin__ ? '" which is already registered by other plugin ' +
                             next.__plugin__ : '"');
                    }

                    if (!next.__plugin__) {
                        if (hasPredefinedHierarchy) {
                            next.__plugin__ = pluginName;
                        } else {
                            throw 'a non-terminal item which no plugin added found at "' + loc + '"';
                        }
                    }
                    locItem = next;
                } else {
                    locItem = (locItem[locSegment] = {});	// create a non-terminal item.
                    locItem.__plugin__ = pluginName;
                }
            });

            return locItem;
        }

        function addItemsToTarget(pluginName, contr, location, target, items) {

            function addItemsToTargetInner(location, target, items) {

                function setShortcutSpecs(terminal) {
                    var shortcutSpec;
                    if (terminal[0] === 'cmnd' && terminal[1] && (shortcutSpec = terminal[1].shortcut)) {
                        shortcutSpec.keys = normalizeKeysStr(shortcutSpec.keys['default']);
                                // TODO: handle non-default cases according to the host-OS
                        if (!shortcutSpec.keys) {
                            return 'The shortcut key specification ' + shortcutSpec.keys['default'] +
                                ' is invalid.';
                        }
                        terminal[1].origShortcut = JSON.parse(JSON.stringify(shortcutSpec)); // deep clone
                    }

                    return null;
                }

                if (Object.keys(items).length > 0 && Object.keys(target).length > 0) {
                    if (whole && !hasPredefinedHierarchy) {
                        addDelimTo(target);
                    }
                }

                _.each(items, function (value, key) {
                    if (key === 'alternateLabel') {
                        return; // special internal keyword. ignore it
                    }

                    var newLocation = location + key;
                    var isTerminal = _.isArray(value);
                    var isNonterminal = _.isObject(value) && !isTerminal;
                    var isDelim = (value === '---');

                    var existing = target[key];
                    if (hasPredefinedHierarchy) {
                        if (!isDelim) {
                            if (existing) {
                                var isExistingTerminal = _.isArray(existing);
                                var isExistingNonterminal = _.isObject(existing) && !isExistingTerminal;
                                if (isExistingTerminal !== isTerminal ||
                                    isExistingNonterminal !== isNonterminal) {
                                    throw 'the type of an added item at "' + newLocation +
                                        'does not match that of the predefiend one.';
                                }
                                if (existing.__plugin__) {
                                    throw 'a dupliate item found at "' + newLocation + '" ' +
                                        ' already registered by another plugin "' + existing.__plugin__ + '"';
                                }
                            } else {
                                if (isVisibleLocation(location)) {
                                    console.warn('Location "' + newLocation +
                                                 '" is outside of the predefined menu hierarchy.');
                                }
                            }

                            if (isTerminal) {
                                target[key] = JSON.parse(JSON.stringify(value)); // deep clone
                                target[key].__plugin__ = pluginName;
                                target[key].__ext__ = contr;
                                setShortcutSpecs(target[key]);
                            } else if (isNonterminal) {
                                if (!existing) {
                                    existing = target[key] = {};
                                }
                                existing.__plugin__ = pluginName;
                                addItemsToTargetInner(newLocation + '/', existing, value);
                            } else {
                                throw 'unreachable';
                            }
                        }
                    } else {
                        if (existing) {
                            console.assert(existing.__plugin__, 'assertion fail: unreachable');
                            throw 'a dupliate item found at "' + newLocation + '" ' +
                                ' already registered by another plugin "' + existing.__plugin__ + '"';
                        }

                        if (isDelim) {
                            if (whole && !hasPredefinedHierarchy) {
                                addDelimTo(target);
                            }
                        } else if (isTerminal) {
                            target[key] = JSON.parse(JSON.stringify(value)); // deep clone
                            target[key].__plugin__ = pluginName;
                            target[key].__ext__ = contr;
                            setShortcutSpecs(target[key]);
                        } else if (isNonterminal) {
                            addItemsToTargetInner(newLocation + '/',
                                                  (target[key] = { __plugin__: pluginName }),
                                                  value);
                        }
                    }

                    if (value.alternateLabel) {
                        console.assert(!whole, 'assertion fail: accumulating viable items');
                        target[key].alternateLabel = value.alternateLabel;
                    }
                });
            }

            addItemsToTargetInner(location, target, items);
        }

        function trimAccumulation(item) {

            var itemFound = false;
            var lastDelimeterName = null;
            _.each(item, function (val, key) {
                if (isItem(val) && key !== INVISIBLE_KEY) {
                    if (val.__plugin__) {
                        itemFound = true;
                        lastDelimeterName = null;
                        if (isNonterminal(val)) {
                            trimAccumulation(val);
                        }
                    } else {
                        delete item[key];
                    }
                } else if (isDelimeter(val)) {
                    if (itemFound) {
                        lastDelimeterName = key;
                    } else {
                        delete item[key];	// delete a delimeter
                                            // above which no items exist
                    }
                }
            });

            // if no item below a delemeter, delete that delimeter
            if (lastDelimeterName) {
                delete item[lastDelimeterName];
            }
        }

        var hasPredefinedHierarchy = Object.keys(accum).length > 0;
        console.assert(!hasPredefinedHierarchy || whole);

        var pluginName;
        try {
            contributors.forEach(function (contr, i) {

                pluginName = contr.__plugin__.manifest.name;
                var location = contr.location || getInvisibleLocation(i);
                var target = getTargetItemAtLocation(location);
                addItemsToTarget(pluginName, contr, location, target, contr.wholeItems);
            });
        } catch (e) {
            return 'While adding menu items from a plugin "' + pluginName + '", ' + e;
        }

        trimAccumulation(accum);

        return null;
    }

    function checkAccelKeys(item) {
        if (typeof item === 'object' && !_.isArray(item)) {
            var ownKeys = Object.keys(item);
            var ownKeysLen = ownKeys.length;
            var i, key, map = {};
            for (i = 0; i < ownKeysLen; i++) {
                key = ownKeys[i];
                var accelKeyIdx = key.indexOf('&') + 1;
                if (accelKeyIdx > 0) {
                    var accelKey = key.charAt(accelKeyIdx).toUpperCase();
                    var plugin = map[accelKey];
                    if (plugin) {
                        return ['/', accelKey, plugin, item[key].__plugin__];
                    } else {
                        map[accelKey] = item[key].__plugin__;
                    }
                }
            }
            for (i = 0; i < ownKeysLen; i++) {
                key = ownKeys[i];
                var ret = checkAccelKeys(item[key]);
                if (ret) {
                    ret[0] = '/' + key + ret[0];
                    return ret;
                }
            }
        }

        return null;
    }

    function checkViableItems(viableTree, wholeTree) {

        if (!wholeTree) {
            return ' does not exist in the extension specification';
        }

        if (isDelimeter(viableTree)) {
            return null;		// ok
        } else if (isTerminal(viableTree)) {
            if (isTerminal(wholeTree) && viableTree[0] === wholeTree[0]) {
                return null;	// ok
            } else {
                return ': its type does not match the type ' +
                    'given in the extension specification';
            }
        } else if (isNonterminal(viableTree)) {
            try {
                _.each(viableTree, function (viableItem, key) {
                    if (key === 'alternateLabel') {
                        return;		// ignore it
                    }
                    if (viableItem) {
                        var errMsg = checkViableItems(viableItem, wholeTree[key]);
                        if (errMsg) {
                            throw '/' + key + errMsg;
                        }
                    } else {
                        throw ': falsy item';
                    }
                });
            } catch (e) {
                return e;
            }

            return null;	// ok
        } else {
            console.debug(viableTree);
            return ' is neither a delimeter, terminal item, nor non-terminal item';
        }
    }

    function getSubitem(item, itemPath) {

        var segments = _.compact(itemPath.split('/'));
        var len = segments.length;
        for (var i = 0; i < len; i++) {
            item = item[segments[i]];
            if (!item) {
                return null;
            }
        }

        return item;
    }

    function itemPathToCmdName(itemPath) {
        var cmdName = itemPath.substr(itemPath.lastIndexOf('/') + 1);
        return cmdName.replace(/&/g, '');
    }

    function getCmdsStr(shortcutItems) {
        var paths = shortcutItems.map(function (item) { return item.path; });
        var cmdNames = paths.map(function (path) { return itemPathToCmdName(path); });
        return cmdNames.join(', ');
    }

    function MenuItemTree(predefinedHierarchy, contributors, topElem, pluginName, options) {

        options = options || {};
        if (menuedPlugins.indexOf(pluginName) >= 0) {
            return new Error('Plug-in ' + pluginName + ' already created an MenuItemTree object');
        }
        menuedPlugins.push(pluginName);

        //
        var errMsg = checkEachContributor(contributors);
        if (errMsg) {
            return new Error(errMsg);
        }

        /*
           . A menu item cannot be both terminal and non-terminal.
           . A terminal item cannot be registered twice (or more).
           . An accelerator key (specified by '&') cannot duplicate among a set of
             sibling items.
         */

        topologicalSortWithLocations(contributors);

        // accumulates menu items from contributors
        var wholeItems = JSON.parse(JSON.stringify(predefinedHierarchy)); // deep clone
        if (Object.keys(wholeItems).length > 0) {
            addBoundaryDelimeters(wholeItems);
        }
        errMsg = accumulateContributions(wholeItems, contributors, true);
        if (errMsg) {
            return new Error(errMsg);
        }

        // check if an accelerator key duplicates in a set of sibling items.
        var ret = checkAccelKeys(wholeItems);
        if (ret) {
            return new Error('Plugins ' + ret[2] + ' and ' + ret[3] +
                             ' register the same accelerator key ' + ret[1] + ' at an item ' + ret[0]);
        }

        //console.log('hina temp: in MenuItemTree.');
        //console.log('hina temp:   pluginName = ' + pluginName);
        //console.log('hina temp:   topElem.id = ' + topElem.id);
        //console.debug(topElem);
        //console.log('hina temp:   before setting. topElem.tabIndex = ' + topElem.tabIndex);

        if (typeof topElem.tabIndex !== 'number' || topElem.tabIndex < 0) {
            topElem.tabIndex = '0';
            //console.log('hina temp:   after setting. topElem.tabIndex = ' + topElem.tabIndex);
            //console.debug(topElem);
        }

        var wholeShortcutItems = {};
        errMsg = collectShortcutItems(wholeShortcutItems, wholeItems, '/');
        if (errMsg) {
            return new Error(errMsg);
        }

        this._contributors = contributors;
        this._wholeItems = wholeItems;
        this._pluginName = pluginName;
        this._wholeShortcutItems = wholeShortcutItems;
        this._options = _.extend({
            // default options for the menu system
            warnUnviableItems: true
        }, options);

        var self = this;

        prefStore.addLoadedListener(function () {
            var delta = prefStore.getValue('shortcutKeysDelta:' + pluginName);
            if (delta) {
                try {
                    delta = JSON.parse(delta);
                    Object.keys(delta).forEach(function (itemPath) {
                        var errMsg = self.setShortcut(itemPath, delta[itemPath], true);
                        console.assert(!errMsg);
                    });
                } catch (e) {
                    console.error('Error while restoring shortcut chanbges: ' + e);
                }
            }
        });

        topElem.addEventListener('keydown', function (event) {
            //console.log('hina temp: keydown event handler registered in a MenuItemTree of ' + pluginName);
            //console.log('hina temp: event.keyCode = ' + event.keyCode);

            if (modifierKeyCodes.indexOf(event.keyCode) > -1) {
                return;
            }

            var mainKey = codeToKeyMap[event.keyCode];
            if (!mainKey) {
                return;
            }

            var keys = [];
            if (event.shiftKey) { keys.push('shift'); }
            if (event.metaKey) { keys.push('meta'); }
            if (event.ctrlKey) { keys.push('ctrl'); }
            if (event.altKey) { keys.push('alt'); }

            //console.log('hina temp: event.target = ' + event.target);
            //console.debug(event.target);

            keys.push(mainKey);
            keys = keys.join('+');
            keys = normalizeKeysStr(keys);

            //console.log('hina temp: keys = ' + keys);

            var shortcutItems;
            if ((shortcutItems = self._wholeShortcutItems[keys])) {

                var keepDefault = shortcutItems.every(function (scItem) {  return scItem.keepDefault; });
                var propagate = shortcutItems.every(function (scItem) {  return scItem.propagate; });
                var skipInvoc = shortcutItems.every(function (scItem) {  return scItem.skipInvoc; });
                if (!keepDefault) {
                    event.preventDefault();
                }
                if (!propagate) {
                    event.stopPropagation();
                }

                self.getViableItems(function (viableItems) {
                    /* jshint unused:false */
                    var scItem, viableSCItem,
                        viableSCItems = shortcutItems.filter(function (scItem) {
                        return getSubitem(viableItems, scItem.path);
                    });

                    switch (viableSCItems.length) {
                    case 0:  // why not just bubble up?
                        if (!skipInvoc && self._options.warnUnviableItems) {
                            toastr.warning('None of the commands "' + getCmdsStr(shortcutItems) +
                                           '" bound to the shortcut "' + keys +
                                           '" is viable in the current context of ' +
                                           pluginName + '.');
                        }

                        break;
                    case 1:
                        viableSCItem = viableSCItems[0];
                        if (!viableSCItem.skipInvoc) {
                            self.invoke(viableSCItem.path);
                        }
                        break;
                    default:
                        toastr.error('More than one commands "' + getCmdsStr(viableSCItems) +
                                     '" are bound to the shortcut "' +  keys +
                                     '" in the current context of ' + pluginName + '.');
                    }
                });
                 /* jshint unused:true */
            }

        });

        $(topElem).bind('bubble', function (evt) {
            //console.log('hina temp: bubble event reached to ' + pluginName);
            if (!evt.menuHolders) {
                evt.menuHolders = [];
            }
            if (!evt.bubbleTouchers) {
                evt.bubbleTouchers = [];
            }
            evt.menuHolders.push(pluginName);
            evt.bubbleTouchers.push(pluginName);

        });

    }

    MenuItemTree.prototype.getWholeItems = function () {
        return this._wholeItems;
    };

    var emptyItems = Object.freeze({});
    MenuItemTree.prototype.getViableItems = function (cb) {

        var total = this._contributors.length;

        if (total > 0) {
            var contributors = [];
            this._contributors.forEach(function (contr) {
                var deferred = new Deferred();
                contributors.push(deferred);
                require([contr.module], function (mod) {

                    var itemRoot;
                    var t = Date.now();
                    if (typeof mod[contr.getViableItems] === 'function') {
                        try {
                            itemRoot = mod[contr.getViableItems]();
                        } catch (e) {
                            console.error('Module "' + contr.module + '" raised an exception while ' +
                                          'it computes viable menu items in function "' +
                                          contr.getViableItems + '": ' + e.stack);
                            itemRoot = emptyItems;
                        }

                    } else {
                        alert('Module "' + contr.module + '" does not have a function named "' +
                              contr.getViableItems + '" to compute viable menu items');
                        itemRoot = emptyItems;
                    }

                    when(itemRoot).then(function (itemRoot) {
                        if (Date.now() - t > 500) {
                            console.warn('It took too long a time for a menu extension in the plugin "' +
                                         contr.__plugin__.manifest.name + '" to resolve its menu items');
                        }
                        itemRoot = itemRoot || emptyItems;
                        var errMsg = checkViableItems(itemRoot, contr.wholeItems);
                        if (errMsg) {
                            alert('Invalid viable menu items from a plugin ' +
                                  contr.__plugin__.manifest.name + ': ' +
                                  contr.location + errMsg.substr(1));
                            itemRoot = emptyItems;
                        }
                        deferred.resolve({location: contr.location,
                                          wholeItems: itemRoot,
                                          __plugin__: contr.__plugin__});
                    }, function (err) {
                        if (Date.now() - t > 500) {
                            console.warn('It toook too long a time for a menu extension in the plugin "' +
                                         contr.__plugin__.manifest.name + '" to reject its menu items');
                        }
                        console.warn('A menu extension in the plugin "' +
                                     contr.__plugin__.manifest.name +
                                    '" rejected to resolve its viable menu items: ' + err);
                        deferred.resolve({location: contr.location,
                                          wholeItems: emptyItems,
                                          __plugin__: contr.__plugin__});
                    });
                });
            });

            all(contributors).then(function (contributors) {
                function deleteEmptyNonterminalNodes(items) {
                    var n, wholeTerminalItems = 0;
                    Object.keys(items).forEach(function (key) {
                        var item = items[key];
                        if (isTerminal(item)) {
                            wholeTerminalItems++;
                        } else if (isNonterminal(item)) {
                            n = deleteEmptyNonterminalNodes(item);
                            if (n === 0) {
                                delete items[key];
                            } else {
                                wholeTerminalItems += n;
                            }
                        }
                    });
                    return wholeTerminalItems;
                }

                console.assert(total === contributors.length);

                var enabledItems = {};
                var errMsg = accumulateContributions(enabledItems, contributors, false);
                if (errMsg) {
                    alert('Error occurred while building enabled menu items: ' + errMsg);
                    cb(emptyItems);
                } else {
                    //console.debug(enabledItems);
                    deleteEmptyNonterminalNodes(enabledItems);
                    cb(enabledItems);
                }
            });
        } else {
            cb(emptyItems);
        }
    };

    MenuItemTree.prototype.invoke = function (itemPath, arg1) {

        //console.log('hina temp: invoke with itemPath = ' + itemPath);

        var item = getSubitem(this._wholeItems, itemPath);
        if (!item) {
            toastr.error('Error: no such item: ' + itemPath);
            return;
        }
        if (_.isArray(item)) {

            var self = this;
            var contr = item.__ext__;
            require([contr.module], function (mod) {

                function invokeFromViableItems(viableItems) {
                    if (Date.now() - t > 500) {
                        console.warn('It toook too long a time for a menu extension in the plugin "' +
                                     contr.__plugin__.manifest.name + '" to resolve its menu items');
                    }

                    if (viableItems) {
                        var subpath = contr.location ?
                            itemPath.substr(contr.location.length) : itemPath.split('/').slice(3).join('/');

                        var item2 = getSubitem(viableItems, subpath);
                        if (item2) {
                            if (_.isArray(item2) && item2[0] === item[0]) {

                                // check module path and function name
                                if (typeof item2[1] === 'string' && typeof item2[2] === 'string') {
                                    require([item2[1]], function (mod) {
                                        var func = mod[item2[2]];
                                        if (func) {
                                            switch (item2[0]) {
                                            case 'cmnd':
                                                func.call(mod, item2[3]);
                                                break;
                                            case 'flag' :
                                                func.call(mod);
                                                break;
                                            case 'enum':
                                            case 'radio':
                                                func.call(mod, arg1);
                                                break;
                                            default:
                                                toastr.error('Invalid terminal item type: ' + item2[0]);
                                            }
                                        } else {
                                            toastr.error('No such function ' + item2[2] + ' in the module ' +
                                                         item2[1]);
                                        }
                                    });
                                } else if (item2[1] || item2[2]) {
                                    toastr.error('The viable item is not a valid terminal menu item');
                                }
                            } else {
                                toastr.error('The viable item is not a valid terminal menu item');
                            }

                            return;
                        }
                    }

                    if (self._options.warnUnviableItems) {
                        toastr.warning('The command "' + itemPathToCmdName(itemPath) +
                                       '" is not viable in the current context of ' +
                                       self._pluginName + '.');
                    }
                }

                var t;
                if (mod[contr.getViableItems]) {
                    t = Date.now();
                    var viableItems = mod[contr.getViableItems]();
                    when(viableItems, invokeFromViableItems, function (err) {
                        if (Date.now() - t > 500) {
                            console.warn('It toook too long a time for a menu extension in the plugin "' +
                                         contr.__plugin__.manifest.name + '" to reject its menu items');
                        }
                        console.warn('A menu extension in the plugin "' +
                                     contr.__plugin__.manifest.name +
                                    '" rejected to resolve its viable menu items: ' + err);
                        invokeFromViableItems(null);
                    });

                } else {
                    toastr.error('Module ' + contr.module + ' have to implement a function named ' +
                          contr.getViableItems);
                }
            });

        } else {
            toastr.error('Internal Error: Non-terminal menu item invoked: ' + itemPath);
            return;
        }
    };

    //
    // functions and methods related to shortcut keys management
    //

    function onShortcutChanged(menuItemTree, restoring) {
        function getShortcutDelta(wholeItems) {
            var accum = {};

            function accumShortcutDelta(itemPath) {
                var item = getSubitem(wholeItems, itemPath);
                console.assert(item, 'assertion fail: an item must exist at "' + itemPath + '"');

                if (_.isArray(item)) {
                    var itemOptions;
                    if (item[0] === 'cmnd' && (itemOptions = item[1]) &&
                        (itemOptions.origShortcut || itemOptions.shortcut)) {
                        if (itemOptions.origShortcut) {
                            if (itemOptions.shortcut) {
                                if (itemOptions.shortcut.keys !== itemOptions.origShortcut.keys) {
                                    accum[itemPath] = itemOptions.shortcut.keys;
                                }
                            } else {
                                accum[itemPath] = '';
                            }
                        } else {
                            accum[itemPath] = itemOptions.shortcut.keys;
                        }
                    }
                } else if (_.isObject(item)) {
                    try {
                        Object.keys(item).forEach(function (key) {
                            var errMsg = accumShortcutDelta(itemPath + key + '/');
                            if (errMsg) {
                                throw errMsg;
                            }
                        });
                    } catch (e) {
                        return e;
                    }
                }
            }

            var errMsg = accumShortcutDelta('/');
            console.assert(!_.isString(errMsg),
                           'assertion fail: error while getting shortcut key changes: ' +
                           errMsg);
            return accum;
        }

        menuItemTree._wholeShortcutItems = {};
        var errMsg = collectShortcutItems(menuItemTree._wholeShortcutItems, menuItemTree._wholeItems, '/');
        console.assert(!errMsg);

        if (!restoring) {
            var changed = {}, delta = getShortcutDelta(menuItemTree._wholeItems);
            changed['shortcutKeysDelta:' + menuItemTree._pluginName] = JSON.stringify(delta);
            prefStore.updateValues(changed);
        }
    }


    MenuItemTree.prototype.setShortcut = function (itemPath, newKeys, restoring) {
        var errMsg = null;
        var changed = false;
        var item = getSubitem(this._wholeItems, itemPath);
        if (item instanceof Array && item[0] === 'cmnd') {
            var itemOptions = item[1];
            if (newKeys) {
                var normalized = normalizeKeysStr(newKeys);
                if (normalized) {
                    newKeys = normalized;
                    if (!itemOptions) {
                        itemOptions = item[1] = {};
                    }
                    if (!itemOptions.shortcut) {
                        itemOptions.shortcut = {};
                    }
                    if (itemOptions.shortcut.keys !== newKeys) {
                        itemOptions.shortcut.keys = newKeys;
                        changed = true;
                    }
                } else {
                    errMsg = 'Given shortcut keys "' + newKeys + '" are invalid';
                }
            } else {
                if (itemOptions) {
                    if (itemOptions.origShortcut) {
                        if (itemOptions.shortcut !== null) {
                            itemOptions.shortcut = null;
                            changed = true;
                        }
                    } else {
                        if (itemOptions.shortcut !== undefined) {
                            delete itemOptions.shortcut;
                            changed = true;
                        }
                    }
                }
            }
        } else {
            errMsg = 'Given menu item path "' + itemPath + '" does not match a command menu item.';
        }

        if (changed) {
            onShortcutChanged(this, restoring);
        }

        return errMsg;
    };


    MenuItemTree.prototype.resetShortcuts = function (itemPath) {
        function resetShortcuts(itemPath, wholeItems) {
            var item = getSubitem(wholeItems, itemPath);
            if (!item) {
                return 'Given path "' + itemPath + '" does not match a menu item';
            }

            if (_.isArray(item)) {
                var itemOptions;
                if (item[0] === 'cmnd' && (itemOptions = item[1]) &&
                    (itemOptions.origShortcut || itemOptions.shortcut)) {
                    if (itemOptions.origShortcut) {
                        console.assert(itemOptions.shortcut,
                                       'assertion fail: shortcut specification must exist');
                        if (itemOptions.shortcut.keys !== itemOptions.origShortcut.keys) {
                            itemOptions.shortcut = JSON.parse(JSON.stringify(itemOptions.origShortcut));
                            return true;
                        }
                    } else {
                        delete itemOptions.shortcut;
                        return true;
                    }
                }
            } else if (_.isObject(item)) {
                var changed = false;
                try {
                    Object.keys(item).forEach(function (key) {
                        var res = resetShortcuts(itemPath + key + '/', wholeItems);
                        if (_.isString(res)) {
                            throw res;
                        }
                        changed = changed || res;
                    });
                } catch (e) {
                    return e;
                }
                return changed;
            }

            return false;
        }

        var res = resetShortcuts(itemPath, this._wholeItems);
        if (_.isString(res)) {
            return res;
        } else {
            if (res) {  // if any shortcut keys have changed
                onShortcutChanged(this);
            }
            return res;
        }
    };

    MenuItemTree.prototype.openShortcutKeysSettingDialog = function (loc) {
        var item = getSubitem(this._wholeItems, loc);
        console.assert(item && item[0] === 'cmnd');

        var menuItemTree = this;
        require(['dojo/dom', 'dojo/store/Memory', 'dijit/registry',
                 'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
                 'text!./layer/shortcutKeysSettingDlg.html'],
                function (dom, Memory, reg, ButtonedDialog, markupTmpl) {

            //console.log('hina temp: loc = ' + loc);
            //console.log(markup);
            if (!reg.byId('wsks-radio-one')) {
                var markup = markupTmpl.replace(/%LOCATION%/, loc.replace(/&/g, ''));
                markup = markup.replace(/%MENU_HOLDER%/, menuItemTree._pluginName);

                var dlg = new ButtonedDialog({
                    title: 'Setting Shortcut Keys',
                    refocus: false,
                    style: 'width: 400px',

                    buttons: [
                        {
                            caption: 'Reset',
                            id: 'wsks-reset-button',
                            methodOnClick: 'reset'
                        },
                        {
                            caption: 'Save',
                            id: 'wsks-save-button',
                            methodOnClick: 'save'
                        },
                        {
                            caption: 'Cancel',
                            methodOnClick: 'hide'
                        }
                    ],

                    methodOnEnter: 'save',

                    reset: function () {
                        if (this.resetButton && !this.resetButton.disabled) {
                            dlg._setWidgetsByKeysStr(dlg.origKeys);
                        }
                    },

                    save: function () {
                        if (this.saveButton && !this.saveButton.disabled) {
                            menuItemTree.setShortcut(loc, this.editedKeys === 'None' ? '' : this.editedKeys);
                            dlg.hide();
                        }
                    },

                    onHide: function () {
                        dlg.destroyRecursive();
                        require(['../plugin'], function (workbench) {
                            workbench.focusLastWidget();
                        });
                    },

                    _setWidgetsByKeysStr: function (keysStr) {
                        if (keysStr === 'None') {
                            dlg.radioButtonNone.set('checked', true);
                        } else {
                            var keys = keysStr.split('+');
                            dlg.radioButtonOne.set('checked', true);
                            dlg.checkBoxCtrl.set('checked', keys.indexOf('Ctrl') >= 0);
                            dlg.checkBoxShift.set('checked', keys.indexOf('Shift') >= 0);
                            dlg.checkBoxAlt.set('checked', keys.indexOf('Alt') >= 0);
                            dlg.mainKeyComboBox.set('value', _.last(keys));
                        }
                    },

                    onLoad: function () {


                        function calcAndSetEditedKeys(none) {
                            if (none) {
                                dlg.set('editedKeys', 'None');
                            } else {
                                var keys = [];
                                if (dlg.checkBoxCtrl.checked) {
                                    keys.push('Ctrl');
                                }
                                if (dlg.checkBoxShift.checked) {
                                    keys.push('Shift');
                                }
                                if (dlg.checkBoxAlt.checked) {
                                    keys.push('Alt');
                                }
                                keys.push(dlg.mainKeyComboBox.value);

                                dlg.set('editedKeys', keys.join('+'));
                            }
                        }

                        function setInitialStatesOfWidgets() {
                            console.assert(dlg.origKeys,
                                   'assertion fail: origKeys must be set first');

                            // arbitrary initial states of the check boxes
                            dlg.mainKeyComboBox.textbox.addEventListener('keydown', function (evt) {
                                // cannot type in the text box of the combo box
                                evt.preventDefault();
                                evt.stopPropagation();
                            });
                            // set main key data
                            var modifierKeys = ['Ctrl', 'Shift', 'Alt'];
                            var mainKeysData = Object.keys(keyCode.keyToCodeMap).filter(function (key) {
                                return modifierKeys.indexOf(key) < 0;
                            }).map(function (keyStr) {
                                return { name: keyStr };
                            });
                            var store = new Memory({ data: mainKeysData });
                            dlg.mainKeyComboBox.set({
                                store: store,
                                searchAttr: 'name'
                            });

                            if (dlg.origKeys === 'None') {
                                dlg.checkBoxCtrl.set('checked', true);
                                dlg.checkBoxShift.set('checked', true);
                                dlg.checkBoxAlt.set('checked', true);
                                dlg.mainKeyComboBox.set('value', 'Enter');
                                dlg.editedKeysLabel.textContent = 'Ctrl+Shift+Alt+Enter';
                            } else {
                                var o = dlg.origKeys;
                                dlg.checkBoxCtrl.set('checked', o.indexOf('Ctrl') >= 0);
                                dlg.checkBoxShift.set('checked', o.indexOf('Shift') >= 0);
                                dlg.checkBoxAlt.set('checked', o.indexOf('Alt') >= 0);
                                dlg.mainKeyComboBox.set('value', _.last(o.split('+')));
                                dlg.editedKeysLabel.textContent = o;
                            }
                        }

                        function setWatchersToWidgets() {
                            dlg.radioButtonNone.watch('checked', function (prop, oldVal, newVal) {
                                if (newVal) {
                                    calcAndSetEditedKeys(true);
                                    dlg.checkBoxCtrl.set('disabled', true);
                                    dlg.checkBoxShift.set('disabled', true);
                                    dlg.checkBoxAlt.set('disabled', true);
                                    dlg.mainKeyComboBox.set('disabled', true);
                                }
                            });

                            dlg.radioButtonOne.watch('checked', function (prop, oldVal, newVal) {
                                if (newVal) {
                                    calcAndSetEditedKeys(false);
                                    dlg.checkBoxCtrl.set('disabled', false);
                                    dlg.checkBoxShift.set('disabled', false);
                                    dlg.checkBoxAlt.set('disabled', false);
                                    dlg.mainKeyComboBox.set('disabled', false);
                                }
                            });

                            dlg.checkBoxCtrl.watch('checked', calcAndSetEditedKeys.bind(null, false));
                            dlg.checkBoxShift.watch('checked', calcAndSetEditedKeys.bind(null, false));
                            dlg.checkBoxAlt.watch('checked', calcAndSetEditedKeys.bind(null, false));
                            dlg.mainKeyComboBox.watch('value', calcAndSetEditedKeys.bind(null, false));
                        }

                        function setWatchersToKeysValues() {
                            dlg.watch('curKeys', function (prop, oldVal, newVal) {
                                // NOTE: called only once
                                console.assert(oldVal === undefined);
                                dlg._setWidgetsByKeysStr(newVal);
                            });

                            dlg.watch('editedKeys', function (prop, oldVal, newVal) {
                                console.assert(dlg.origKeys,
                                       'assertion fail: origKeys must be set first');

                                if (newVal !== 'None') {
                                    dlg.editedKeysLabel.textContent = newVal;
                                }

                                dlg.msgLabel.style.cssText = 'color: #000000';
                                if (newVal === dlg.origKeys) {
                                    dlg.msgLabel.textContent =
                                        '(Same as the app\'s initial setting)';
                                    dlg.resetButton.set('disabled', true);
                                } else {
                                    dlg.msgLabel.textContent =
                                        '(Different from the app\'s initial setting ' +
                                        dlg.origKeys + ')';
                                    dlg.resetButton.set('disabled', false);
                                }

                                dlg.saveButton.set('disabled', newVal === dlg.curKeys);

                                var conflictingItems = (menuItemTree._wholeShortcutItems[newVal] || emptyArr);
                                conflictingItems = conflictingItems.filter(function (scItem) {
                                    return scItem.path !== loc;
                                });
                                if (conflictingItems.length > 0) {
                                    var cmdNames = conflictingItems.map(function (scItem) {
                                        return itemPathToCmdName(scItem.path);
                                    });

                                    dlg.msgLabel.style.cssText = 'color: #FF0000';
                                    dlg.msgLabel.textContent =
                                        '(Already bound to another command "' + cmdNames.join(', ') + '")';
                                    dlg.saveButton.set('disabled', true);
                                }
                            });
                        }

                        dlg.radioButtonNone = reg.byId('wsks-radio-none');
                        dlg.radioButtonOne = reg.byId('wsks-radio-one');
                        dlg.checkBoxCtrl = reg.byId('wsks-use-ctrl');
                        dlg.checkBoxShift = reg.byId('wsks-use-shift');
                        dlg.checkBoxAlt = reg.byId('wsks-use-alt');
                        dlg.mainKeyComboBox = reg.byId('wsks-main-key');
                        dlg.resetButton = reg.byId('wsks-reset-button');
                        dlg.saveButton = reg.byId('wsks-save-button');
                        dlg.msgLabel = dom.byId('wsks-msg-label');
                        dlg.editedKeysLabel = dom.byId('wsks-edited-keys');

                        var itemOpt = item[1];
                        dlg.origKeys = itemOpt && itemOpt.origShortcut ? itemOpt.origShortcut.keys: 'None';

                        setInitialStatesOfWidgets();
                        setWatchersToWidgets();
                        setWatchersToKeysValues();

                        dlg.set('curKeys', itemOpt && itemOpt.shortcut ? itemOpt.shortcut.keys: 'None');
                    },
                });
                dlg.setContentArea(markup);
                dlg.startup();
                dlg.show();

            }
        });
    };

    MenuItemTree.normalizeKeysStr = normalizeKeysStr;

    return MenuItemTree;
});
