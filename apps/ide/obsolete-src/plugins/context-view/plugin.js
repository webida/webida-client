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

define(['underscore',
        'widgets/views/view',
        'dijit/layout/TabContainer',
        'dijit/layout/ContentPane',
        'lib/codemirror/lib/codemirror'],
       function (_, View, TabContainer, ContentPane, CodeMirror) {
    'use strict';

    var contextView = new View('contextView', 'Contextual');
    var tabContainer = new TabContainer({ style: 'height: 100%; width: 100%' }, 'context-view-tab-container');
    contextView.setContent(tabContainer);

    return {
        /*
         * contents: [
         *   {
         *     name: string
         *     data?: Data({
         *       type: string
         *       << additional fields depending on type >>
         *       -- if type is 'text' =>
         *       text: string
         *       -- if type is 'html' =>
         *       html: string
         *       -- if type is 'image' =>
         *       src: string  -- url
         *       -- if type is 'code' =>
         *       file: string -- file path
         *       text: string -- text
         *       mode: string -- file mode(type)
         *       theme: string -- theme name
         *       start: {line, ch} -- marker
         *       end: {line, ch}   -- line number
         *     })
         *     func?: () => Data
         *     -- either data or func must be contained
         *   }
         * ]
         */
        showContent: function (contents) {
            _.each(tabContainer.getChildren(), function (tab) {
                tab.setContent('');
                tabContainer.removeChild(tab);
            });
            // tabContainer.destroyDescendants(false);
            _.each(contents, function (item) {
                if (item.data && !item.func) {
                    item.func = function () {
                        return item.data;
                    };
                }
                var cp = new ContentPane({
                    title: item.name,
                    content: ''
                });
                var renderer = function () {
                    console.log('on show', item);
                    var data = item.func();
                    switch (data.type) {
                    case 'html':
                        cp.setContent(data.html);
                        break;
                    case 'text':
                        cp.setContent($('<div>').text(data.text).html());
                        break;
                    case 'image':
                        cp.setContent($('<div>').append($('<img>').attr('src', data.src)).html());
                        break;
                    case 'code':
                        var cm, elem = $('<div style="width: 100%; height:100%; overflow: hidden">');
                        var opt = {
                            value: data.text,
                            readOnly: 'nocursor',
                            lineNumbers: true,
                            theme: 'webida'
                        };
                        if (data.mode) opt.mode = data.mode;
                        if (data.theme) opt.theme = data.theme;
                        cm = CodeMirror(elem[0], opt);
                        cm.setSize('100%', '100%');
                        console.log("Elem: ", cm.getWrapperElement());
                        cp.setContent(elem[0]);
                        _.defer(function () {
                            cm.refresh();
                            if (data.start && data.end) {
                                cm.markText(data.start, data.end, {
                                    className: 'CodeMirror-highlighted'
                                });
                                var coord = cm.charCoords(data.start, 'local');
                                cm.scrollTo(0, coord.top);
                            }
                        });
                        if (data.file) {
                            cp.on('dblclick', function () {
                                require(['plugins/codeeditor/plugin'], function (CodeEditor) {
                                    if (data.start && data.end) {
                                        CodeEditor.moveTo({
                                            filepath: data.file,
                                            start: data.start,
                                            end: data.end
                                        });
                                    } else {
                                        CodeEditor.moveTo({
                                            filepath: data.file
                                        });
                                    }
                                });
                            });
                        }
                        break;
                    }
                };
                cp.onShow = _.once(renderer);
                tabContainer.addChild(cp);
            });
        },
        getView: function () {
            return contextView;
        },
        onViewAppended: function () {
        }
    };
});
