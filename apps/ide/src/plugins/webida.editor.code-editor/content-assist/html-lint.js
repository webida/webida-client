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
 * original code from
 *   https://github.com/philipwalton/html-inspector/blob/master/src/rules/validation/
 */

define(['other-lib/underscore/lodash.min',
        'webida-lib/custom-lib/codemirror/lib/codemirror',
        '../lib/html-inspector/src/modules/validation',
        './html-dom',
        './html-io'],
function (_, CodeMirror, validation, htmldom, htmlio) {
    'use strict';

    // TODO below should be removed
    // use FileModel class instead
    function getLineLengths(text) {
        var lens = [];
        var lastIndex = 0;
        var re = /\r?\n/g;

        while (re.test(text)) {
            lens.push(re.lastIndex - lastIndex);
            lastIndex = re.lastIndex;
        }

        lens.push(text.length - lastIndex - 1);

        return lens;
    }

    function getPositionFromIndex(lineLengths, index) {
        var sum = 0;

        for (var i = 0; i < lineLengths.length; i++) {
            sum += lineLengths[i];
            if (sum > index) {
                return {
                    line : i,
                    ch : index - sum + lineLengths[i]
                };
            }
        }

        return {
            line : lineLengths.length - 1,
            ch : 0
        };
    }

    /**
     * w3c 141 : ID X already defined
     * @return {array}
     */
    function verifyIdDuplication(doc) {
        var messages = [];

        var ids = {};

        _.each(doc.getElementsByTagName('*'), function (elem) {
            var attr = elem.getAttributeNode('id');
            if (attr) {
                ids[attr.value] = (ids[attr.value] || []);
                ids[attr.value].push(attr);
            }
        });

        for (var key in ids) {
            if (ids.hasOwnProperty(key)) {
                if (ids[key].length > 1) {
                    for (var i = 0 ; i < ids[key].length; i++) {
                        var attr = ids[key][i];
                        messages.push({
                            start : attr.parentNode.openingStart,
                            end : attr.parentNode.openingEnd,
                            message : 'The id "' + attr.value + '" appears more than once in the document.',
                            type : 'warning'
                        });
                    }
                }
            }
        }

        return {
            messages: messages
        };
    }


    var uniqueElements = ['title', 'main'];

    /**
     * w3c within 64 : document type does not allow element X here
     */
    function verifyUniqueElements(doc) {
        var messages = [];

        var elems = {};

        _.each(doc.getElementsByTagName('*'), function (elem) {
            var elemName = elem.nodeName.toLowerCase();
            if (uniqueElements.indexOf(elemName) >= 0) {
                (elems[elemName] = elems[elemName] || []).push(elem);
            }
        });

        for (var key in elems) {
            if (elems.hasOwnProperty(key)) {
                if (elems[key].length > 1) {
                    for (var i = 0; i < elems[key].length; i++) {
                        var elem = elems[key][i];
                        messages.push({
                            start : elem.openingStart,
                            end : elem.openingEnd,
                            message : 'The <' + elem.nodeName.toLowerCase() +
                                '> appears may only appear once in the document.',
                            type : 'warning'
                        });
                    }
                }
            }
        }

        return {
            messages: messages
        };
    }


    /**
     * w3c 127 : required attribute X not specified
     * w3c none : absolete attributes
     * w3c 108 : there is no attribute X
     **/
    function verifyAttributes(doc) {
        var messages = [];

        _.each(doc.getElementsByTagName('*'), function (elem) {
            var elemName = elem.nodeName.toLowerCase();
            var required = validation.getRequiredAttributesForElement(elemName);
            required.forEach(function (attr) {
                if (!elem.hasAttribute(attr)) {
                    messages.push({
                        start : elem.openingStart,
                        end : elem.openingEnd,
                        message : 'The "' + attr + '" attribute is required for <' + elemName + '> elements.',
                        type : 'warning'
                    });
                }
            });

            _.each(elem.attributes, function (attr) {
                // don't validate the attributes of invalid elements
                if (!validation.isElementValid(elemName)) {
                    return;
                }

                if (validation.isAttributeObsoleteForElement(attr.name, elemName)) {
                    messages.push({
                        start : elem.openingStart,
                        end : elem.openingEnd,
                        message : 'The "' + attr.name +
                            '" attribute is no loger valid on the <' + elemName +
                            '> element and should not be used.',
                        type : 'warning'
                    });
                } else if (!validation.isAttributeValidForElement(attr.name, elemName)) {
                    messages.push({
                        start : elem.openingStart,
                        end : elem.openingEnd,
                        message : '"' + attr.name + '" is not a valid attribute of the <' + elemName + '> element.',
                        type : 'warning'
                    });
                }
            });
        });

        return {
            messages : messages
        };
    }


    /**
     * w3c within 64 : document type does not allow element X here
     **/
    function verifyElementLocation(doc) {
        var messages = [];

        _.each(doc.getElementsByTagName('*'), function (elem) {
            if (elem.parentNode && elem.parentNode.nodeType === htmldom.Node.ELEMENT_NODE) {
                var elemName = elem.nodeName.toLowerCase();
                var parentName = elem.parentNode.nodeName.toLowerCase();

                if (!validation.isChildAllowedInParent(elemName, parentName)) {
                    messages.push({
                        start : elem.openingStart,
                        end : elem.openingEnd,
                        message : 'The <' + elemName + '> element cannot be child of the <' + parentName + '> element.',
                        type : 'warning'
                    });
                }
            }
        });

        return {
            messages : messages
        };
    }


    /**
     * w3c none : absolete elements
     * w3c 76 : element X undefined
     **/
    function verifyElements(doc) {
        var messages = [];

        _.each(doc.getElementsByTagName('*'), function (elem) {
            var elemName = elem.nodeName.toLowerCase();

            if (validation.isElementObsolete(elemName)) {
                messages.push({
                    start : elem.openingStart,
                    end : elem.openingEnd,
                    message : 'The <' + elemName + '> element is obsolete and should not be used.',
                    type : 'warning'
                });
            } else if (!validation.isElementValid(elemName)) {
                messages.push({
                    start : elem.openingStart,
                    end : elem.openingEnd,
                    message : 'The <' + elemName + '> element is not a valid HTML element.',
                    type : 'warning'
                });
            }
        });

        return {
            messages : messages
        };
    }



    function convertMessagesToFound(messages, found, lineLengths) {
        var message = null;

        for (var i = 0; i < messages.length; i++) {
            message = messages[i];
            var startpos = getPositionFromIndex(lineLengths, message.start);
            var endpos = getPositionFromIndex(lineLengths, message.end);
            found.push({
                from: CodeMirror.Pos(startpos.line, startpos.ch),
                to: CodeMirror.Pos(endpos.line, endpos.ch + 1),
                message: message.message,
                sevirity: message.type
            });
        }
    }

    CodeMirror.registerHelper('lint', 'html', function (text) {
        var found = [];
        var results = null;

        var doc = htmlio.parse(text);
        var lineLengths = getLineLengths(text);

        results = verifyIdDuplication(doc);
        convertMessagesToFound(results.messages, found, lineLengths);

        results = verifyUniqueElements(doc);
        convertMessagesToFound(results.messages, found, lineLengths);

        results = verifyAttributes(doc);
        convertMessagesToFound(results.messages, found, lineLengths);

        results = verifyElementLocation(doc);
        convertMessagesToFound(results.messages, found, lineLengths);

        results = verifyElements(doc);
        convertMessagesToFound(results.messages, found, lineLengths);

        return found;
    });
});
