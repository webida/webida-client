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

define(['./htmlparser2/lib/Parser', './htmlparser2/lib/Tokenizer', './DomElementType/index', './DomHandler/index'],
       function (Parser, Tokenizer, ElementType, DomHandler) {
	'use strict';

    return {
		Parser: Parser,
		Tokenizer: Tokenizer,
		ElementType: ElementType,
		DomHandler: DomHandler,

        //FeedHandler
        //Stream
        //WritableStream
        //ProxyHandler
        //DomUtils
        //CollectingHandler
        //RssHandler

		parse: function (data, options) {
            var handler = new DomHandler(options);
			var parser = new Parser(handler, options);
			parser.end(data);
			return handler.dom;
		},
        /*
        parseFeed: function(feed, options){
            var handler = new module.exports.FeedHandler();
            var parser = new Parser(handler);
            parser.end(feed);
            return handler.dom;
        },
        createDomStream: function(cb, options, elementCb){
            var handler = new DomHandler(cb, options, elementCb);
            return new Parser(handler, options);
        },
        */
        // List of all events that the parser emits
        EVENTS: { /* Format: eventname: number of arguments */
            attribute: 2,
            cdatastart: 0,
            cdataend: 0,
            text: 1,
            processinginstruction: 2,
            comment: 1,
            commentend: 0,
            closetag: 1,
            opentag: 2,
            opentagname: 1,
            error: 1,
            end: 0
        },

        TYPES: {
            Text: ElementType.Text,
            Directive: ElementType.Directive,
            Comment: ElementType.Comment,
            Script: ElementType.Script,
            Style: ElementType.Style,
            Tag: ElementType.Tag,
            CDATA: ElementType.CDATA
        }
    };
});
