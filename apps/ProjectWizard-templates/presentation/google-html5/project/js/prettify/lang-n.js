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

var a=null;
PR.registerLangHandler(PR.createSimpleLexer([["str",/^(?:'(?:[^\n\r'\\]|\\.)*'|"(?:[^\n\r"\\]|\\.)*(?:"|$))/,a,'"'],["com",/^#(?:(?:define|elif|else|endif|error|ifdef|include|ifndef|line|pragma|undef|warning)\b|[^\n\r]*)/,a,"#"],["pln",/^\s+/,a," \r\n\t\xa0"]],[["str",/^@"(?:[^"]|"")*(?:"|$)/,a],["str",/^<#[^#>]*(?:#>|$)/,a],["str",/^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h|[a-z]\w*)>/,a],["com",/^\/\/[^\n\r]*/,a],["com",/^\/\*[\S\s]*?(?:\*\/|$)/,
a],["kwd",/^(?:abstract|and|as|base|catch|class|def|delegate|enum|event|extern|false|finally|fun|implements|interface|internal|is|macro|match|matches|module|mutable|namespace|new|null|out|override|params|partial|private|protected|public|ref|sealed|static|struct|syntax|this|throw|true|try|type|typeof|using|variant|virtual|volatile|when|where|with|assert|assert2|async|break|checked|continue|do|else|ensures|for|foreach|if|late|lock|new|nolate|otherwise|regexp|repeat|requires|return|surroundwith|unchecked|unless|using|while|yield)\b/,
a],["typ",/^(?:array|bool|byte|char|decimal|double|float|int|list|long|object|sbyte|short|string|ulong|uint|ufloat|ulong|ushort|void)\b/,a],["lit",/^@[$_a-z][\w$@]*/i,a],["typ",/^@[A-Z]+[a-z][\w$@]*/,a],["pln",/^'?[$_a-z][\w$@]*/i,a],["lit",/^(?:0x[\da-f]+|(?:\d(?:_\d+)*\d*(?:\.\d*)?|\.\d\+)(?:e[+-]?\d+)?)[a-z]*/i,a,"0123456789"],["pun",/^.[^\s\w"-$'./@`]*/,a]]),["n","nemerle"]);
