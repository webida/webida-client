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

define(['external/lodash/lodash.min'],
function (_) {
    'use strict';
    var snippets = [
        {
            content: 'function (${1:argument}) {\n	${3:// body ...}$0\n}',
            trigger: 'fun',
            scope: 'source.js',
            description: 'Anonymous Function'
        },
        {
            content: 'function ${1:function_name}(${2:argument}) {\n	${3:// body...}$0\n}',
            trigger: 'Fun',
            scope: 'source.js',
            description: 'Function'
        },
        {
            content: 'for (var ${20:i} = 0; ${20:i} < ${1:Things}.length; ${20:i}++) {\n	' +
                '${100:${1:Things}[${20:i}]}$0\n}',
            trigger: 'for',
            scope: 'source.js',
            description: 'for (…) {…}'
        },
        {
            content: 'setTimeout(function () {\n	${1:// body ...}\n}, ${2:10}$0);',
            trigger: 'timeout',
            scope: 'source.js',
            description: 'setTimeout function'
        },
        {
            content: '${1:class_name}.prototype.${2:method_name} = function (${3:argument}) {\n	' +
                '${4:// body...}$0\n};\n',
            trigger: 'proto',
            scope: 'source.js',
            description: 'Prototype'
        },
        {
            content: '${1:field_name}:${2:value}${0:,}',
            trigger: ':',
            scope: 'source.js',
            description: 'Object Field'
        },
        {
            content: '${1:method_name}: function(${2:argument}){\n	${3:// body ...}\n}${0:,}',
            trigger: 'method',
            scope: 'source.js',
            description: 'Object Method'
        },

        {
            content: 'if (${1:true}) {\n	${2:// then part}\n} else {\n	${3:// else part}$0\n}',
            trigger: 'ife',
            scope: 'source.js',
            description: 'if … else'
        },
        {
            content: 'if (${1:true}) {\n	${2:// then part}$0\n}',
            trigger: 'if',
            scope: 'source.js',
            description: 'if'
        },
        {
            content: 'getElement${1/(T)|.*/(?1:s)/}By${1:T}${1/(T)|(I)|.*/(?1:agName)(?2:d)/}(\'$2\')',
            trigger: 'get',
            scope: 'source.js',
            description: 'Get Elements'
        },
        {
            scope: 'text.html - source - meta.tag, punctuation.definition.tag.begin',
            completions: [
                { trigger: 'a', contents: '<a href="$1">$2</a>' },
                { trigger: 'abbr', contents: '<abbr>$1</abbr>' },
                { trigger: 'acronym', contents: '<acronym>$1</acronym>' },
                { trigger: 'address', contents: '<address>$1</address>' },
                { trigger: 'applet', contents: '<applet>$1</applet>' },
                { trigger: 'area', contents: '<area>$1</area>' },
                { trigger: 'b', contents: '<b>$1</b>' },
                { trigger: 'base', contents: '<base>$1</base>' },
                { trigger: 'big', contents: '<big>$1</big>' },
                { trigger: 'blockquote', contents: '<blockquote>$1</blockquote>' },
                { trigger: 'body', contents: '<body>$1</body>' },
                { trigger: 'button', contents: '<button>$1</button>' },
                { trigger: 'center', contents: '<center>$1</center>' },
                { trigger: 'caption', contents: '<caption>$1</caption>' },
                { trigger: 'cdata', contents: '<cdata>$1</cdata>' },
                { trigger: 'cite', contents: '<cite>$1</cite>' },
                { trigger: 'col', contents: '<col>$1</col>' },
                { trigger: 'colgroup', contents: '<colgroup>$1</colgroup>' },
                { trigger: 'code', contents: '<code>$1</code>' },
                { trigger: 'div', contents: '<div>$1</div>' },
                { trigger: 'dd', contents: '<dd>$1</dd>' },
                { trigger: 'del', contents: '<del>$1</del>' },
                { trigger: 'dfn', contents: '<dfn>$1</dfn>' },
                { trigger: 'dl', contents: '<dl>$1</dl>' },
                { trigger: 'dt', contents: '<dt>$1</dt>' },
                { trigger: 'em', contents: '<em>$1</em>' },
                { trigger: 'fieldset', contents: '<fieldset>$1</fieldset>' },
                { trigger: 'font', contents: '<font>$1</font>' },
                { trigger: 'form', contents: '<form>$1</form>' },
                { trigger: 'frame', contents: '<frame>$1</frame>' },
                { trigger: 'frameset', contents: '<frameset>$1</frameset>' },
                { trigger: 'head', contents: '<head>$1</head>' },
                { trigger: 'h1', contents: '<h1>$1</h1>' },
                { trigger: 'h2', contents: '<h2>$1</h2>' },
                { trigger: 'h3', contents: '<h3>$1</h3>' },
                { trigger: 'h4', contents: '<h4>$1</h4>' },
                { trigger: 'h5', contents: '<h5>$1</h5>' },
                { trigger: 'h6', contents: '<h6>$1</h6>' },
                { trigger: 'i', contents: '<i>$1</i>' },
                { trigger: 'iframe', contents: '<iframe src="$1"></iframe>' },
                { trigger: 'ins', contents: '<ins>$1</ins>' },
                { trigger: 'kbd', contents: '<kbd>$1</kbd>' },
                { trigger: 'li', contents: '<li>$1</li>' },
                { trigger: 'label', contents: '<label>$1</label>' },
                { trigger: 'legend', contents: '<legend>$1</legend>' },
                { trigger: 'link', contents: '<link rel="stylesheet" type="text/css" href="$1">' },
                { trigger: 'map', contents: '<map>$1</map>' },
                { trigger: 'noframes', contents: '<noframes>$1</noframes>' },
                { trigger: 'object', contents: '<object>$1</object>' },
                { trigger: 'ol', contents: '<ol>$1</ol>' },
                { trigger: 'optgroup', contents: '<optgroup>$1</optgroup>' },
                { trigger: 'option', contents: '<option>$0</option>' },
                { trigger: 'p', contents: '<p>$1</p>' },
                { trigger: 'pre', contents: '<pre>$1</pre>' },
                { trigger: 'span', contents: '<span>$1</span>' },
                { trigger: 'samp', contents: '<samp>$1</samp>' },
                { trigger: 'script', contents: '<script type="${1:text/javascript}">$0</script>' },
                { trigger: 'style', contents: '<style type="${1:text/css}">$0</style>' },
                { trigger: 'select', contents: '<select>$1</select>' },
                { trigger: 'small', contents: '<small>$1</small>' },
                { trigger: 'strong', contents: '<strong>$1</strong>' },
                { trigger: 'sub', contents: '<sub>$1</sub>' },
                { trigger: 'sup', contents: '<sup>$1</sup>' },
                { trigger: 'table', contents: '<table>$1</table>' },
                { trigger: 'tbody', contents: '<tbody>$1</tbody>' },
                { trigger: 'td', contents: '<td>$1</td>' },
                { trigger: 'textarea', contents: '<textarea>$1</textarea>' },
                { trigger: 'tfoot', contents: '<tfoot>$1</tfoot>' },
                { trigger: 'th', contents: '<th>$1</th>' },
                { trigger: 'thead', contents: '<thead>$1</thead>' },
                { trigger: 'title', contents: '<title>$1</title>' },
                { trigger: 'tr', contents: '<tr>$1</tr>' },
                { trigger: 'tt', contents: '<tt>$1</tt>' },
                { trigger: 'u', contents: '<u>$1</u>' },
                { trigger: 'ul', contents: '<ul>$1</ul>' },
                { trigger: 'var', contents: '<var>$1</var>' },

                { trigger: 'br', contents: '<br>' },
                { trigger: 'embed', contents: '<embed>' },
                { trigger: 'hr', contents: '<hr>' },
                { trigger: 'img', contents: '<img src="$1">' },
                { trigger: 'input', contents: '<input>' },
                { trigger: 'meta', contents: '<meta>' },
                { trigger: 'param', contents: '<param name="$1" value="$2">' },

                { trigger: 'article', contents: '<article>$1</article>' },
                { trigger: 'aside', contents: '<aside>$1</aside>' },
                { trigger: 'audio', contents: '<audio>$1</audio>' },
                { trigger: 'canvas', contents: '<canvas>$1</canvas>' },
                { trigger: 'footer', contents: '<footer>$1</footer>' },
                { trigger: 'header', contents: '<header>$1</header>' },
                { trigger: 'nav', contents: '<nav>$1</nav>' },
                { trigger: 'section', contents: '<section>$1</section>' },
                { trigger: 'video', contents: '<video>$1</video>' },


                { trigger: 'A', contents: '<A HREF="$1">$2</A>' },
                { trigger: 'ABBR', contents: '<ABBR>$1</ABBR>' },
                { trigger: 'ACRONYM', contents: '<ACRONYM>$1</ACRONYM>' },
                { trigger: 'ADDRESS', contents: '<ADDRESS>$1</ADDRESS>' },
                { trigger: 'APPLET', contents: '<APPLET>$1</APPLET>' },
                { trigger: 'AREA', contents: '<AREA>$1</AREA>' },
                { trigger: 'B', contents: '<B>$1</B>' },
                { trigger: 'BASE', contents: '<BASE>$1</BASE>' },
                { trigger: 'BIG', contents: '<BIG>$1</BIG>' },
                { trigger: 'BLOCKQUOTE', contents: '<BLOCKQUOTE>$1</BLOCKQUOTE>' },
                { trigger: 'BODY', contents: '<BODY>$1</BODY>' },
                { trigger: 'BUTTON', contents: '<BUTTON>$1</BUTTON>' },
                { trigger: 'CENTER', contents: '<CENTER>$1</CENTER>' },
                { trigger: 'CAPTION', contents: '<CAPTION>$1</CAPTION>' },
                { trigger: 'CDATA', contents: '<CDATA>$1</CDATA>' },
                { trigger: 'CITE', contents: '<CITE>$1</CITE>' },
                { trigger: 'COL', contents: '<COL>$1</COL>' },
                { trigger: 'COLGROUP', contents: '<COLGROUP>$1</COLGROUP>' },
                { trigger: 'CODE', contents: '<CODE>$1</CODE>' },
                { trigger: 'DIV', contents: '<DIV>$1</DIV>' },
                { trigger: 'DD', contents: '<DD>$1</DD>' },
                { trigger: 'DEL', contents: '<DEL>$1</DEL>' },
                { trigger: 'DFN', contents: '<DFN>$1</DFN>' },
                { trigger: 'DL', contents: '<DL>$1</DL>' },
                { trigger: 'DT', contents: '<DT>$1</DT>' },
                { trigger: 'EM', contents: '<EM>$1</EM>' },
                { trigger: 'FIELDSET', contents: '<FIELDSET>$1</FIELDSET>' },
                { trigger: 'FONT', contents: '<FONT>$1</FONT>' },
                { trigger: 'FORM', contents: '<FORM>$1</FORM>' },
                { trigger: 'FRAME', contents: '<FRAME>$1</FRAME>' },
                { trigger: 'FRAMESET', contents: '<FRAMESET>$1</FRAMESET>' },
                { trigger: 'HEAD', contents: '<HEAD>$1</HEAD>' },
                { trigger: 'H1', contents: '<H1>$1</H1>' },
                { trigger: 'H2', contents: '<H2>$1</H2>' },
                { trigger: 'H3', contents: '<H3>$1</H3>' },
                { trigger: 'H4', contents: '<H4>$1</H4>' },
                { trigger: 'H5', contents: '<H5>$1</H5>' },
                { trigger: 'H6', contents: '<H6>$1</H6>' },
                { trigger: 'I', contents: '<I>$1</I>' },
                { trigger: 'IFRAME', contents: '<IFRAME src="$1"></IFRAME>' },
                { trigger: 'INS', contents: '<INS>$1</INS>' },
                { trigger: 'KBD', contents: '<KBD>$1</KBD>' },
                { trigger: 'LI', contents: '<LI>$1</LI>' },
                { trigger: 'LABEL', contents: '<LABEL>$1</LABEL>' },
                { trigger: 'LEGEND', contents: '<LEGEND>$1</LEGEND>' },
                { trigger: 'LINK', contents: '<LINK>$1</LINK>' },
                { trigger: 'MAP', contents: '<MAP>$1</MAP>' },
                { trigger: 'NOFRAMES', contents: '<NOFRAMES>$1</NOFRAMES>' },
                { trigger: 'OBJECT', contents: '<OBJECT>$1</OBJECT>' },
                { trigger: 'OL', contents: '<OL>$1</OL>' },
                { trigger: 'OPTGROUP', contents: '<OPTGROUP>$1</OPTGROUP>' },
                { trigger: 'OPTION', contents: '<OPTION>$1</OPTION>' },
                { trigger: 'P', contents: '<P>$1</P>' },
                { trigger: 'PRE', contents: '<PRE>$1</PRE>' },
                { trigger: 'SPAN', contents: '<SPAN>$1</SPAN>' },
                { trigger: 'SAMP', contents: '<SAMP>$1</SAMP>' },
                { trigger: 'SCRIPT', contents: '<SCRIPT TYPE="${1:text/javascript}">$0</SCRIPT>' },
                { trigger: 'STYLE', contents: '<STYLE TYPE="${1:text/css}">$0</STYLE>' },
                { trigger: 'SELECT', contents: '<SELECT>$1</SELECT>' },
                { trigger: 'SMALL', contents: '<SMALL>$1</SMALL>' },
                { trigger: 'STRONG', contents: '<STRONG>$1</STRONG>' },
                { trigger: 'SUB', contents: '<SUB>$1</SUB>' },
                { trigger: 'SUP', contents: '<SUP>$1</SUP>' },
                { trigger: 'TABLE', contents: '<TABLE>$1</TABLE>' },
                { trigger: 'TBODY', contents: '<TBOYD>$1</TBODY>' },
                { trigger: 'TD', contents: '<TD>$1</TD>' },
                { trigger: 'TEXTAREA', contents: '<TEXTAREA>$1</TEXTAREA>' },
                { trigger: 'TFOOT', contents: '<TFOOT>$1</TFOOT>' },
                { trigger: 'TH', contents: '<TH>$1</TH>' },
                { trigger: 'THEAD', contents: '<THEAD>$1</THEAD>' },
                { trigger: 'TITLE', contents: '<TITLE>$1</TITLE>' },
                { trigger: 'TR', contents: '<TR>$1</TR>' },
                { trigger: 'TT', contents: '<TT>$1</TT>' },
                { trigger: 'U', contents: '<U>$1</U>' },
                { trigger: 'UL', contents: '<UL>$1</UL>' },
                { trigger: 'VAR', contents: '<VAR>$1</VAR>' },

                { trigger: 'BR', contents: '<BR>' },
                { trigger: 'EMBED', contents: '<EMBED>' },
                { trigger: 'HR', contents: '<HR>' },
                { trigger: 'IMG', contents: '<IMG SRC="$1">' },
                { trigger: 'INPUT', contents: '<INPUT>' },
                { trigger: 'META', contents: '<META>' },
                { trigger: 'PARAM', contents: '<PARAM NAME="$1" VALUE="$2">' },

                { trigger: 'ARTICLE', contents: '<ARTICLE>$1</ARTICLE>' },
                { trigger: 'ASIDE', contents: '<ASIDE>$1</ASIDE>' },
                { trigger: 'AUDIO', contents: '<AUDIO>$1</AUDIO>' },
                { trigger: 'CANVAS', contents: '<CANVAS>$1</CANVAS>' },
                { trigger: 'FOOTER', contents: '<FOOTER>$1</FOOTER>' },
                { trigger: 'HEADER', contents: '<HEADER>$1</HEADER>' },
                { trigger: 'NAV', contents: '<NAV>$1</NAV>' },
                { trigger: 'SECTION', contents: '<SECTION>$1</SECTION>' },
                { trigger: 'VIDEO', contents: '<VIDEO>$1</VIDEO>' }
            ]
        }
    ];
    function getSnippets(token, mode) {
        var tokenString = token.string.trim();
        if (tokenString === '') {
            return [];
        }
        var exacts = [];
        var cands = _.flatten(_.map(snippets, function (snippet) {
            var triggerMatch = function (snippet) {
                if (snippet.trigger === tokenString) {
                    exacts.push(snippet);
                }
                return snippet.trigger.indexOf(tokenString) === 0;
            };
            // TODO reimplement the following scope matcher
            if (snippet.scope &&
                (snippet.scope.indexOf('source.' + mode) >= 0) ||
                (snippet.scope.indexOf('text.' + mode) >= 0)) {
                if (snippet.completions) {
                    return _.filter(snippet.completions, triggerMatch);
                } else {
                    if (triggerMatch(snippet)) {
                        return [snippet];
                    }
                }
            }
            return [];
        }), false);
        if (exacts.length > 0) {
            return exacts;
        } else {
            return cands;
        }
    }
    function expandSnippet(cm) {
        if (cm.__snippetCancelled) {
            cm.__snippetCancelled = false;
            return false;
        }
        var cursor = cm.getCursor();
        var token = cm.getTokenAt(cursor);
        var mode = cm.__instance.getMode();
        var filteredSnippets = getSnippets(token, mode);
        var start = {line: cursor.line, ch: token.start};
        var end = {line: cursor.line, ch: token.end};
        console.log(token, filteredSnippets);
        var expand = function (snippet) {
            var contents = snippet.contents || snippet.content;
            var replacedContents = '';
            var navigations = [];
            var cursor = {line: start.line, ch: start.ch};
            var addToReplacedContents = function (string) {
                replacedContents += string;
                // TODO move cursor
                for (var i = 0; i < string.length; i++) {
                    if (string.charAt(i) === '\n') {
                        cursor.line++;
                        cursor.ch = 0;
                    } else {
                        cursor.ch++;
                    }
                }
            };
            var cloneCursor = function () {
                return {line: cursor.line, ch: cursor.ch};
            };
            var addNavigation = function (tabstop, start, end) {
                navigations.push({
                    tabstop: tabstop,
                    start: start,
                    end: end,
                });
            };
            var neutral = function (pointer) {
                while (pointer < contents.length) {
                    var c = contents.charAt(pointer);
                    switch (c) {
                    case '\\':
                        addToReplacedContents(contents.charAt(pointer + 1));
                        pointer += 1;
                        break;
                    case '$':
                        pointer = afterDollar(pointer + 1);
                        break;
                    default:
                        addToReplacedContents(c);
                        pointer += 1;
                    }
                }
            };
            var nested = function (pointer) {
                while (pointer < contents.length) {
                    var c = contents.charAt(pointer);
                    switch (c) {
                    case '\\':
                        addToReplacedContents(contents.charAt(pointer + 1));
                        pointer += 1;
                        break;
                    case '}':
                        return pointer;
                    case '$':
                        pointer = afterDollar(pointer + 1);
                        break;
                    default:
                        addToReplacedContents(c);
                        pointer += 1;
                    }
                }
                return pointer;
            };
            var number = function (pointer) {
                var temp = '', c = contents.charAt(pointer);
                while ('0' <= c && c <= '9') {
                    temp += c;
                    c = contents.charAt(++pointer);
                }
                return { pointer: pointer, number: temp };
            };
            var variable = function (pointer) {
                var temp = '', c = contents.charAt(pointer);
                while (('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9') || c === '_') {
                    temp += c;
                    c = contents.charAt(++pointer);
                }
                return { pointer: pointer, name: temp };
            };
            var skipToBrace = function (pointer) {
                // skipping to }
                var c = contents.charAt(pointer), temp = '';
                while (c !== '}' && c !== '') {
                    temp += c;
                    if (c === '\\') { pointer++; }
                    c = contents.charAt(++pointer);
                }
                return { pointer: pointer, value: temp };
            };
            var afterDollar = function (pointer) {
                var v;
                var c = contents.charAt(pointer);
                if ('0' <= c && c <= '9') {
                    // just tabstop
                    v = number(pointer);
                    addNavigation(v.number, cloneCursor(), cloneCursor());
                    pointer = v.pointer;
                } else if (c === '{') {
                    // placeholderOrDefaultValue
                    c = contents.charAt(++pointer);
                    if ('0' <= c && c <= '9') {
                        // ${«tab stop»:«default value»} OR ${«tab stop»/«regexp»/«format»/«options»}
                        // no whitespace is allowed between ${ and «tab stop»
                        v = number(pointer);
                        pointer = v.pointer;
                        c = contents.charAt(pointer);
                        switch (c) {
                        case ':':
                            // placeholder
                            var cursorBefore = cloneCursor();
                            pointer = nested(pointer + 1);
                            addNavigation(v.number, cursorBefore, cloneCursor());
                            return (pointer + 1);
                        case '/':
                            // TODO implement this
                            return (skipToBrace(pointer + 1).pointer + 1);
                            // should not be here
                        }
                    } else {
                        // ${«variable»:«default value»} OR ${«variable»/«regexp»/«format»/«options»}
                        // no whitespace is allowed between ${ and «variable»
                        v = variable(pointer);
                        pointer = v.pointer;
                        // we just ignore everything related to variables at this moment
                        c = contents.charAt(pointer);
                        return (skipToBrace(pointer + 1).pointer + 1);
                    }
                } else {
                    // variable
                    v = variable(pointer);
                    // TODO insert variable to replacedContents
                    pointer = v.pointer;
                }
                return pointer;
            };
            neutral(0);
            cm.replaceRange(replacedContents, start, end);
            if (!_.some(navigations, function (nav) { return nav.tabstop === '0'; })) {
                addNavigation('0', cloneCursor(), cloneCursor());
            }
            navigations = _.map(
                _.groupBy(navigations, function (nav) { return nav.tabstop; }),
                function (navs, tabstop) { return {tabstop: tabstop, navs: navs}; });
            navigations.sort(function (a, b) {
                if (a.tabstop === '0') {
                    return 1;
                }
                return (+a.tabstop) - (+b.tabstop);
            });
            _.each(navigations, function (navs) {
                _.each(navs.navs, function (nav) {
                    if (nav.start.line === nav.end.line && nav.start.ch === nav.end.ch) {
                        nav.marker = cm.setBookmark(nav.start, {
                            insertLeft: true
                        });
                    } else {
                        nav.marker = cm.markText(nav.start, nav.end, {
                            inclusiveLeft: true,
                            inclusiveRight: true,
                            preserveWhenDeleted: true
                        });
                    }
                    nav.marker.__fromSnippet = navs;
                });
            });
            for (var line = start.line; line <= cursor.line; line++) {
                cm.indentLine(line);
            }
            cm.__snippetNavigation = navigations;
            cm.__snippetCurrent = 0;
            selectSnippetNav(cm, navigations, 0);
            // console.log(navigations);
        };
        if (filteredSnippets.length === 1) {
            // exactly one candidate
            // expand snippet and register snippet navigation info
            expand(filteredSnippets[0]);
            return true;
        } else if (filteredSnippets.length > 1) {
            // more than one candidates
            // TODO show dialog and let user select one
            expand(filteredSnippets[0]);
            return true;
        }
    }
    function selectSnippetNav(cm, allnavs, index) {
        _.each(allnavs, function (nav, i) {
            if (i !== index) {
                _.each(nav.navs, function (n) {
                    n.marker.className = '';
                    n.marker.changed();
                });
            }
        });
        if (allnavs.hasOwnProperty(index)) {
            var nav = allnavs[index];
            var cursel = nav.navs[0].marker.find();
            _.each(nav.navs, function (n) {
                n.marker.className = 'CodeMirror-highlighted'; // TODO change this class name
                n.marker.changed();
            });
            if (!cursel) {
                clearSnippets(cm);
            } else {
                if (cursel.from && cursel.to) {
                    cm.setSelection(cursel.from, cursel.to);
                } else {
                    cm.setCursor(cursel);
                }
            }
        }
    }
    function clearSnippets(cm) {
        if (cm.__snippetNavigation) {
            _.each(cm.__snippetNavigation, function (navs) {
                _.each(navs.navs, function (nav) {
                    nav.marker.clear();
                });
            });
            cm.__snippetNavigation = undefined;
            cm.__snippetCurrent = -1;
        }
    }
    function navigateSnippet(cm, isBackward) {
        var navigations, current;
        if (!isBackward) {
            if (cm.__snippetNavigation && cm.__snippetCurrent >= 0) {
                navigations = cm.__snippetNavigation;
                current = ++cm.__snippetCurrent;

                if (current >= navigations.length) {
                    clearSnippets(cm);
                } else {
                    selectSnippetNav(cm, navigations, current);
                    return true;
                }
            }
        } else {
            if (cm.__snippetNavigation && cm.__snippetCurrent >= 0) {
                navigations = cm.__snippetNavigation;
                current = --cm.__snippetCurrent;

                if (current >= 0) {
                    selectSnippetNav(cm, navigations, current);
                    return true;
                } else {
                    clearSnippets(cm);
                }
            }
        }
    }

    function init(cm) {
        cm.on('beforeChange', function (cm, e) {
            if (cm.__snippetNavigation && e.origin !== 'snippet') {
                var startMarkers = cm.findMarksAt(e.from), endMarkers = cm.findMarksAt(e.to);
                startMarkers = _.filter(startMarkers, function (m) { return m.__fromSnippet; });
                endMarkers = _.filter(endMarkers, function (m) { return m.__fromSnippet; });
                console.log(startMarkers, endMarkers);
                var snippets = _.filter(startMarkers, function (marker) {
                    return _.some(endMarkers, function (m) {
                        return marker.__fromSnippet.tabstop === m.__fromSnippet.tabstop;
                    });
                });
                if (snippets.length > 0) {
                    console.log(snippets);
                    _.delay(function () {
                        _.each(snippets, function (marker) {
                            if (marker.type === 'range') {
                                var range = marker.find();
                                var content = cm.getRange(range.from, range.to);
                                console.log(content);
                                // TODO range marker to bookmark if the whole marker is deleted
                                _.each(marker.__fromSnippet.navs, function (nav) {
                                    if (marker !== nav.marker) {
                                        var crange = nav.marker.find();
                                        cm.replaceRange(content, crange.from, crange.to, 'snippet');
                                    }
                                });
                            } else if (_.isEqual(e.from, e.to)) {
                                console.log(marker);
                                _.each(marker.__fromSnippet.navs, function (nav) {
                                    if (marker !== nav.marker) {
                                        var cloc = nav.marker.find();
                                        cm.replaceRange(content, cloc, cloc, 'snippet');
                                    }
                                });
                                // TODO bookmark to range marker
                            }
                        });
                    }, 10);
                }
            }
        });

        cm.on('change', function (cm, e) {
            if (e.origin === 'undo') {
                cm.__snippetCancelled = true;
            } else {
                cm.__snippetCancelled = false;
            }
            // cm.__snippetNavigation = [];
            // cm.__snippetCurrent = -1;
        });

        cm.on('cursorActivity', function (cm) {
            if (cm.__snippetNavigation) {
                var inSnippet = _.some(cm.findMarksAt(cm.getCursor()), function (x) {
                    return x.hasOwnProperty('__fromSnippet');
                });
                if (!inSnippet) {
                    clearSnippets(cm);
                }
                // selectSnippetNav(cm, -1);
            }
        });
    }

    return {
        clearSnippets: clearSnippets,
        expandSnippet: expandSnippet,
        navigateSnippet: navigateSnippet,
        init: init
    };
});
