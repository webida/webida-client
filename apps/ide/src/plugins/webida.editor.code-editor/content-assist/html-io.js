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
 * @file
 * HTML parsing module which provides parse() method
 * In this module, DomHandler is defined. 
 * DomHandler defines callbacks for htmlparser2 and is passed to htmlparser2 constructor.
 * htmlparser2 (https://github.com/fb55/htmlparser2)
 *
 * @constructor
 * @since 1.0.0
 * @author changhun.lim@samsung.com
 * @author hyunik.na@samsung.com
 */

define(['external/lodash/lodash.min',
        './html-dom',
        '../lib/htmlparser2/htmlparser2/lib/Parser'],
function (_, dom, Parser) {

    'use strict';

    function DomHandler() {
        this.doc = new dom.Document();
        this._tagStack = [];
    }

    DomHandler.prototype.onreset = function () {
        DomHandler.call(this);
    };

    DomHandler.prototype.onend = function () {
    };

    DomHandler.prototype.onclosetag = function (name, startIndex, endIndex) {
        var elem = this._tagStack.pop();
        if (startIndex !== undefined) {
            elem.closingStart = startIndex;
        }
        if (endIndex !== undefined) {
            elem.closingEnd = endIndex;
        }
    };

    DomHandler.prototype._addNode = function (node) {
        var lastTag = this._tagStack[this._tagStack.length - 1];
        if (lastTag) {
            lastTag.appendChild(node);
        } else {
            this.doc.appendChild(node);
        }
    };

    DomHandler.prototype.onopentag = function (name, attribs, startIndex, endIndex) {
        var elem = new dom.Element(name);

        _.each(attribs, function (value, name) {
            elem.setAttribute(name, value);
        });

        elem.openingStart = startIndex;
        elem.openingEnd = endIndex;

        this._addNode(elem);
        this._tagStack.push(elem);
    };

    DomHandler.prototype.ontext = function (data) {
        if (!this._tagStack.length) {
            if (this.doc.lastChild && this.doc.lastChild.nodeType === dom.Node.TEXT_NODE) {
                this.doc.lastChild.nodeValue += data;
                return;
            }
        } else {
            var lastText;
            if ((lastText = this._tagStack[this._tagStack.length - 1]) &&
                    (lastText = lastText.lastChild) && lastText.nodeType === dom.Node.TEXT_NODE) {
                lastText.nodeValue += data;
                return;
            }
        }

        var newText = new dom.Text();
        newText.nodeValue = data;
        this._addNode(newText);
    };

    DomHandler.prototype.oncomment = function (data) {
        var lastNode = this._tagStack[this._tagStack.length - 1];

        if (lastNode && lastNode.nodeType === dom.Node.COMMENT_NODE) {
            lastNode.nodeValue += data;
            return;
        }

        var newComment = new dom.Comment();
        newComment.nodeValue = data;

        this._addNode(newComment);
        this._tagStack.push(newComment);
    };

    DomHandler.prototype.oncdatastart = function () {
        var newCdata = new dom.CDATASection();

        this._addNode(newCdata);
        this._tagStack.push(newCdata);
    };

    DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function () {
        this._tagStack.pop();
    };

    DomHandler.prototype.onprocessinginstruction = function (name, data) {
        var newProcessing = new dom.ProcessingInstruction();
        newProcessing._setNodeName(name);
        newProcessing._setNodeValue(data);

        this._addNode(newProcessing);
    };


    return {
        /**
         * Parse html text into DOM Document object.
         *
         * @param {string} htmltext - HTML text string.
         * @return {Object} DOM Document object.
         **/
        parse : function (htmltext) {
            var handler = new DomHandler();
            var parser = new Parser(handler);
            parser.end(htmltext);
            return handler.doc;
        }
    };
});
