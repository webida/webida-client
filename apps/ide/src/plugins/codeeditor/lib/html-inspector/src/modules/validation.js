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

define([], function () {

function isRegExp(reg) {
  return reg instanceof RegExp;
}

/**
 * Given a string and a RegExp or a list of strings or RegExps,
 * does the string match any of the items in the list?
 */
function foundIn(needle, haystack) {
  // if haystack is a RegExp and not an array, just compare againt it
  if (isRegExp(haystack)) return haystack.test(needle)

  // if haystack is a String, just compare against it
  if (typeof haystack == "string") return needle == haystack

  // otherwise check each item in the list
  return haystack.some(function(item) {
    return isRegExp(item) ? item.test(needle) : needle === item
  })
}

//var foundIn = require("../utils/string-matcher")

// ============================================================
// A data map of all valid HTML elements, their attributes
// and what type of children they may contain
//
// http://drafts.htmlwg.org/html/master/iana.html#index
// ============================================================

var elementData = {
  "a": {
    children: "transparent*",
    attributes: "globals; href; target; download; rel; hreflang; type"
  },
  "abbr": {
    children: "phrasing",
    attributes: "globals"
  },
  "address": {
    children: "flow*",
    attributes: "globals"
  },
  "area": {
    children: "empty",
    attributes: "globals; alt; coords; shape; href; target; download; rel; hreflang; type"
  },
  "article": {
    children: "flow",
    attributes: "globals"
  },
  "aside": {
    children: "flow",
    attributes: "globals"
  },
  "audio": {
    children: "source*; transparent*",
    attributes: "globals; src; crossorigin; preload; autoplay; mediagroup; loop; muted; controls"
  },
  "b": {
    children: "phrasing",
    attributes: "globals"
  },
  "base": {
    children: "empty",
    attributes: "globals; href; target"
  },
  "bdi": {
    children: "phrasing",
    attributes: "globals"
  },
  "bdo": {
    children: "phrasing",
    attributes: "globals"
  },
  "blockquote": {
    children: "flow",
    attributes: "globals; cite"
  },
  "body": {
    children: "flow",
    attributes: "globals; onafterprint; onbeforeprint; onbeforeunload; onfullscreenchange; onfullscreenerror; onhashchange; onmessage; onoffline; ononline; onpagehide; onpageshow; onpopstate; onresize; onstorage; onunload"
  },
  "br": {
    children: "empty",
    attributes: "globals"
  },
  "button": {
    children: "phrasing*",
    attributes: "globals; autofocus; disabled; form; formaction; formenctype; formmethod; formnovalidate; formtarget; name; type; value"
  },
  "canvas": {
    children: "transparent",
    attributes: "globals; width; height"
  },
  "caption": {
    children: "flow*",
    attributes: "globals"
  },
  "cite": {
    children: "phrasing",
    attributes: "globals"
  },
  "code": {
    children: "phrasing",
    attributes: "globals"
  },
  "col": {
    children: "empty",
    attributes: "globals; span"
  },
  "colgroup": {
    children: "col",
    attributes: "globals; span"
  },
  "menuitem": {
    children: "empty",
    attributes: "globals; type; label; icon; disabled; checked; radiogroup; command"
  },
  "data": {
    children: "phrasing",
    attributes: "globals; value"
  },
  "datalist": {
    children: "phrasing; option",
    attributes: "globals"
  },
  "dd": {
    children: "flow",
    attributes: "globals"
  },
  "del": {
    children: "transparent",
    attributes: "globals; cite; datetime"
  },
  "details": {
    children: "summary*; flow",
    attributes: "globals; open"
  },
  "dfn": {
    children: "phrasing*",
    attributes: "globals"
  },
  "dialog": {
    children: "flow",
    attributes: "globals; open"
  },
  "div": {
    children: "flow",
    attributes: "globals"
  },
  "dl": {
    children: "dt*; dd*",
    attributes: "globals"
  },
  "dt": {
    children: "flow*",
    attributes: "globals"
  },
  "em": {
    children: "phrasing",
    attributes: "globals"
  },
  "embed": {
    children: "empty",
    attributes: "globals; src; type; width; height; any*"
  },
  "fieldset": {
    children: "legend*; flow",
    attributes: "globals; disabled; form; name"
  },
  "figcaption": {
    children: "flow",
    attributes: "globals"
  },
  "figure": {
    children: "figcaption*; flow",
    attributes: "globals"
  },
  "footer": {
    children: "flow*",
    attributes: "globals"
  },
  "form": {
    children: "flow*",
    attributes: "globals; accept-charset; action; autocomplete; enctype; method; name; novalidate; target"
  },
  "h1": {
    children: "phrasing",
    attributes: "globals"
  },
  "h2": {
    children: "phrasing",
    attributes: "globals"
  },
  "h3": {
    children: "phrasing",
    attributes: "globals"
  },
  "h4": {
    children: "phrasing",
    attributes: "globals"
  },
  "h5": {
    children: "phrasing",
    attributes: "globals"
  },
  "h6": {
    children: "phrasing",
    attributes: "globals"
  },
  "head": {
    children: "metadata content*",
    attributes: "globals"
  },
  "header": {
    children: "flow*",
    attributes: "globals"
  },
  "hr": {
    children: "empty",
    attributes: "globals"
  },
  "html": {
    children: "head*; body*",
    attributes: "globals; manifest"
  },
  "i": {
    children: "phrasing",
    attributes: "globals"
  },
  "iframe": {
    children: "text*",
    attributes: "globals; src; srcdoc; name; sandbox; seamless; allowfullscreen; width; height"
  },
  "img": {
    children: "empty",
    attributes: "globals; alt; src; crossorigin; usemap; ismap; width; height"
  },
  "input": {
    children: "empty",
    attributes: "globals; accept; alt; autocomplete; autofocus; checked; dirname; disabled; form; formaction; formenctype; formmethod; formnovalidate; formtarget; height; list; max; maxlength; min; multiple; name; pattern; placeholder; readonly; required; size; src; step; type; value; width"
  },
  "ins": {
    children: "transparent",
    attributes: "globals; cite; datetime"
  },
  "kbd": {
    children: "phrasing",
    attributes: "globals"
  },
  "keygen": {
    children: "empty",
    attributes: "globals; autofocus; challenge; disabled; form; keytype; name"
  },
  "label": {
    children: "phrasing*",
    attributes: "globals; form; for"
  },
  "legend": {
    children: "phrasing",
    attributes: "globals"
  },
  "li": {
    children: "flow",
    attributes: "globals; value*"
  },
  "link": {
    children: "empty",
    attributes: "globals; href; crossorigin; rel; media; hreflang; type; sizes"
  },
  "main": {
    children: "flow*",
    attributes: "globals"
  },
  "map": {
    children: "transparent; area*",
    attributes: "globals; name"
  },
  "mark": {
    children: "phrasing",
    attributes: "globals"
  },
  "menu": {
    children: "li*; flow*; menuitem*; hr*; menu*",
    attributes: "globals; type; label"
  },
  "meta": {
    children: "empty",
    attributes: "globals; name; http-equiv; content; charset"
  },
  "meter": {
    children: "phrasing*",
    attributes: "globals; value; min; max; low; high; optimum"
  },
  "nav": {
    children: "flow",
    attributes: "globals"
  },
  "noscript": {
    children: "varies*",
    attributes: "globals"
  },
  "object": {
    children: "param*; transparent",
    attributes: "globals; data; type; typemustmatch; name; usemap; form; width; height"
  },
  "ol": {
    children: "li",
    attributes: "globals; reversed; start; type"
  },
  "optgroup": {
    children: "option",
    attributes: "globals; disabled; label"
  },
  "option": {
    children: "text*",
    attributes: "globals; disabled; label; selected; value"
  },
  "output": {
    children: "phrasing",
    attributes: "globals; for; form; name"
  },
  "p": {
    children: "phrasing",
    attributes: "globals"
  },
  "param": {
    children: "empty",
    attributes: "globals; name; value"
  },
  "pre": {
    children: "phrasing",
    attributes: "globals"
  },
  "progress": {
    children: "phrasing*",
    attributes: "globals; value; max"
  },
  "q": {
    children: "phrasing",
    attributes: "globals; cite"
  },
  "rp": {
    children: "phrasing",
    attributes: "globals"
  },
  "rt": {
    children: "phrasing",
    attributes: "globals"
  },
  "ruby": {
    children: "phrasing; rt; rp*",
    attributes: "globals"
  },
  "s": {
    children: "phrasing",
    attributes: "globals"
  },
  "samp": {
    children: "phrasing",
    attributes: "globals"
  },
  "script": {
    children: "script, data, or script documentation*",
    attributes: "globals; src; type; charset; async; defer; crossorigin"
  },
  "section": {
    children: "flow",
    attributes: "globals"
  },
  "select": {
    children: "option; optgroup",
    attributes: "globals; autofocus; disabled; form; multiple; name; required; size"
  },
  "small": {
    children: "phrasing",
    attributes: "globals"
  },
  "source": {
    children: "empty",
    attributes: "globals; src; type; media"
  },
  "span": {
    children: "phrasing",
    attributes: "globals"
  },
  "strong": {
    children: "phrasing",
    attributes: "globals"
  },
  "style": {
    children: "varies*",
    attributes: "globals; media; type; scoped"
  },
  "sub": {
    children: "phrasing",
    attributes: "globals"
  },
  "summary": {
    children: "phrasing",
    attributes: "globals"
  },
  "sup": {
    children: "phrasing",
    attributes: "globals"
  },
  "table": {
    children: "caption*; colgroup*; thead*; tbody*; tfoot*; tr*",
    attributes: "globals; border"
  },
  "tbody": {
    children: "tr",
    attributes: "globals"
  },
  "td": {
    children: "flow",
    attributes: "globals; colspan; rowspan; headers"
  },
  "template": {
    children: "flow; metadata",
    attributes: "globals"
  },
  "textarea": {
    children: "text",
    attributes: "globals; autofocus; cols; dirname; disabled; form; maxlength; name; placeholder; readonly; required; rows; wrap"
  },
  "tfoot": {
    children: "tr",
    attributes: "globals"
  },
  "th": {
    children: "flow*",
    attributes: "globals; colspan; rowspan; headers; scope; abbr"
  },
  "thead": {
    children: "tr",
    attributes: "globals"
  },
  "time": {
    children: "phrasing",
    attributes: "globals; datetime"
  },
  "title": {
    children: "text*",
    attributes: "globals"
  },
  "tr": {
    children: "th*; td",
    attributes: "globals"
  },
  "track": {
    children: "empty",
    attributes: "globals; default; kind; label; src; srclang"
  },
  "u": {
    children: "phrasing",
    attributes: "globals"
  },
  "ul": {
    children: "li",
    attributes: "globals"
  },
  "var": {
    children: "phrasing",
    attributes: "globals"
  },
  "video": {
    children: "source*; transparent*",
    attributes: "globals; src; crossorigin; poster; preload; autoplay; mediagroup; loop; muted; controls; width; height"
  },
  "wbr": {
    children: "empty",
    attributes: "globals"
  }
}

// ============================================================
// Element categories and the elements tht are in those
// categories. Elements may be in more than one category
//
// http://drafts.htmlwg.org/html/master/iana.html#element-content-categories
// ============================================================

var elementCategories = {
  "metadata": {
    elements: ["base", "link", "meta", "noscript", "script", "style", "title"]
  },
  "flow": {
    elements: ["a", "abbr", "address", "article", "aside", "audio", "b", "bdi", "bdo", "blockquote", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "details", "dfn", "dialog", "div", "dl", "em", "embed", "fieldset", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "main", "map", "mark", "math", "menu", "meter", "nav", "noscript", "object", "ol", "output", "p", "pre", "progress", "q", "ruby", "s", "samp", "script", "section", "select", "small", "span", "strong", "sub", "sup", "svg", "table", "textarea", "time", "u", "ul", "var", "video", "wbr"],
    exceptions: ["area", "link", "meta", "style"],
    exceptionsSelectors: ["map area", "link[itemprop]", "meta[itemprop]", "style[scoped]"]
  },
  "sectioning": {
    elements: ["article", "aside", "nav", "section"]
  },
  "heading": {
    elements: ["h1", "h2", "h3", "h4", "h5", "h6"]
  },
  "phrasing": {
    elements: ["a", "abbr", "audio", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "embed", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "script", "select", "small", "span", "strong", "sub", "sup", "svg", "textarea", "time", "u", "var", "video", "wbr"],
    exceptions: ["area", "link", "meta"],
    exceptionsSelectors: ["map area", "link[itemprop]", "meta[itemprop]"]
  },
  "embedded": {
    elements: ["audio", "canvas", "embed", "iframe", "img", "math", "object", "svg", "video"]
  },
  "interactive": {
    elements: ["a", "button", "details", "embed", "iframe", "keygen", "label", "select", "textarea"],
    exceptions: ["audio", "img", "input", "object", "video"],
    exceptionsSelectors: ["audio[controls]", "img[usemap]", "input:not([type=hidden])", "object[usemap]", "video[controls]"]
  },
  "sectioning roots": {
    elements: ["blockquote", "body", "details", "dialog", "fieldset", "figure", "td"]
  },
  "form-associated": {
    elements: ["button", "fieldset", "input", "keygen", "label", "object", "output", "select", "textarea"]
  },
  "listed": {
    elements: ["button", "fieldset", "input", "keygen", "object", "output", "select", "textarea"]
  },
  "submittable": {
    elements: ["button", "input", "keygen", "object", "select", "textarea"]
  },
  "resettable": {
    elements: ["input", "keygen", "output", "select", "textarea"]
  },
  "labelable": {
    elements: ["button", "input", "keygen", "meter", "output", "progress", "select", "textarea"]
  },
  "palpable": {
    elements: ["a", "abbr", "address", "article", "aside", "b", "bdi", "bdo", "blockquote", "button", "canvas", "cite", "code", "data", "details", "dfn", "div", "em", "embed", "fieldset", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "i", "iframe", "img", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "nav", "object", "output", "p", "pre", "progress", "q", "ruby", "s", "samp", "section", "select", "small", "span", "strong", "sub", "sup", "svg", "table", "textarea", "time", "u", "var", "video"],
    exceptions: ["audio", "dl", "input", "menu", "ol", "ul"],
    exceptionsSelectors: ["audio[controls]", "dl", "input:not([type=hidden])", "menu[type=toolbar]", "ol", "ul"]
  }
}

// ============================================================
// Attributes that may be used on any valid HTML element
//
// http://drafts.htmlwg.org/html/master/dom.html#global-attributes
// ============================================================

var globalAttributes = [
  // primary
  "accesskey",
  "class",
  "contenteditable",
  "contextmenu",
  "dir",
  "draggable",
  "dropzone",
  "hidden",
  "id",
  "inert",
  "itemid",
  "itemprop",
  "itemref",
  "itemscope",
  "itemtype",
  "lang",
  "spellcheck",
  "style",
  "tabindex",
  "title",
  "translate",
  // additional
  "role",
  /aria-[a-z\-]+/,
  /data-[a-z\-]+/,
  /on[a-z\-]+/
]

// ============================================================
// HTML elements that are obsolete and no longer allowed
//
// http://drafts.htmlwg.org/html/master/obsolete.html#obsolete
// ============================================================

var obsoluteElements = [
  "applet",
  "acronym",
  "bgsound",
  "dir",
  "frame",
  "frameset",
  "noframes",
  "hgroup",
  "isindex",
  "listing",
  "nextid",
  "noembed",
  "plaintext",
  "rb",
  "strike",
  "xmp",
  "basefont",
  "big",
  "blink",
  "center",
  "font",
  "marquee",
  "multicol",
  "nobr",
  "spacer",
  "tt"
]

// ============================================================
// Attributes that are obsolete on certain elements
//
// http://drafts.htmlwg.org/html/master/obsolete.html#obsolete
// ============================================================

var obsoleteAttributes = [
  { attribute: "charset", elements: "a" },
  { attribute: "charset", elements: "link" },
  { attribute: "coords", elements: "a" },
  { attribute: "shape", elements: "a" },
  { attribute: "methods", elements: "a" },
  { attribute: "methods", elements: "link" },
  { attribute: "name", elements: "a" },
  { attribute: "name", elements: "embed" },
  { attribute: "name", elements: "img" },
  { attribute: "name", elements: "option" },
  { attribute: "rev", elements: "a" },
  { attribute: "rev", elements: "link" },
  { attribute: "urn", elements: "a" },
  { attribute: "urn", elements: "link" },
  { attribute: "accept", elements: "form" },
  { attribute: "nohref", elements: "area" },
  { attribute: "profile", elements: "head" },
  { attribute: "version", elements: "html" },
  { attribute: "ismap", elements: "input" },
  { attribute: "usemap", elements: "input" },
  { attribute: "longdesc", elements: "iframe" },
  { attribute: "longdesc", elements: "img" },
  { attribute: "lowsrc", elements: "img" },
  { attribute: "target", elements: "link" },
  { attribute: "scheme", elements: "meta" },
  { attribute: "archive", elements: "object" },
  { attribute: "classid", elements: "object" },
  { attribute: "code", elements: "object" },
  { attribute: "codebase", elements: "object" },
  { attribute: "codetype", elements: "object" },
  { attribute: "declare", elements: "object" },
  { attribute: "standby", elements: "object" },
  { attribute: "type", elements: "param" },
  { attribute: "valuetype", elements: "param" },
  { attribute: "language", elements: "script" },
  { attribute: "event", elements: "script" },
  { attribute: "for", elements: "script" },
  { attribute: "datapagesize", elements: "table" },
  { attribute: "summary", elements: "table" },
  { attribute: "axis", elements: "td; th" },
  { attribute: "scope", elements: "td" },
  { attribute: "datasrc", elements: "a; applet; button; div; frame; iframe; img; input; label; legend; marquee; object; option; select; span; table; textarea" },
  { attribute: "datafld", elements: "a; applet; button; div; fieldset; frame; iframe; img; input; label; legend; marquee; object; param; select; span; textarea" },
  { attribute: "dataformatas", elements: "button; div; input; label; legend; marquee; object; option; select; span; table" },
  { attribute: "alink", elements: "body" },
  { attribute: "bgcolor", elements: "body" },
  { attribute: "link", elements: "body" },
  { attribute: "marginbottom", elements: "body" },
  { attribute: "marginheight", elements: "body" },
  { attribute: "marginleft", elements: "body" },
  { attribute: "marginright", elements: "body" },
  { attribute: "margintop", elements: "body" },
  { attribute: "marginwidth", elements: "body" },
  { attribute: "text", elements: "body" },
  { attribute: "vlink", elements: "body" },
  { attribute: "clear", elements: "br" },
  { attribute: "align", elements: "caption" },
  { attribute: "align", elements: "col" },
  { attribute: "char", elements: "col" },
  { attribute: "charoff", elements: "col" },
  { attribute: "valign", elements: "col" },
  { attribute: "width", elements: "col" },
  { attribute: "align", elements: "div" },
  { attribute: "compact", elements: "dl" },
  { attribute: "align", elements: "embed" },
  { attribute: "hspace", elements: "embed" },
  { attribute: "vspace", elements: "embed" },
  { attribute: "align", elements: "hr" },
  { attribute: "color", elements: "hr" },
  { attribute: "noshade", elements: "hr" },
  { attribute: "size", elements: "hr" },
  { attribute: "width", elements: "hr" },
  { attribute: "align", elements: "h1; h2; h3; h4; h5; h6" },
  { attribute: "align", elements: "iframe" },
  { attribute: "allowtransparency", elements: "iframe" },
  { attribute: "frameborder", elements: "iframe" },
  { attribute: "hspace", elements: "iframe" },
  { attribute: "marginheight", elements: "iframe" },
  { attribute: "marginwidth", elements: "iframe" },
  { attribute: "scrolling", elements: "iframe" },
  { attribute: "vspace", elements: "iframe" },
  { attribute: "align", elements: "input" },
  { attribute: "hspace", elements: "input" },
  { attribute: "vspace", elements: "input" },
  { attribute: "align", elements: "img" },
  { attribute: "border", elements: "img" },
  { attribute: "hspace", elements: "img" },
  { attribute: "vspace", elements: "img" },
  { attribute: "align", elements: "legend" },
  { attribute: "type", elements: "li" },
  { attribute: "compact", elements: "menu" },
  { attribute: "align", elements: "object" },
  { attribute: "border", elements: "object" },
  { attribute: "hspace", elements: "object" },
  { attribute: "vspace", elements: "object" },
  { attribute: "compact", elements: "ol" },
  { attribute: "align", elements: "p" },
  { attribute: "width", elements: "pre" },
  { attribute: "align", elements: "table" },
  { attribute: "bgcolor", elements: "table" },
  { attribute: "cellpadding", elements: "table" },
  { attribute: "cellspacing", elements: "table" },
  { attribute: "frame", elements: "table" },
  { attribute: "rules", elements: "table" },
  { attribute: "width", elements: "table" },
  { attribute: "align", elements: "tbody; thead; tfoot" },
  { attribute: "char", elements: "tbody; thead; tfoot" },
  { attribute: "charoff", elements: "tbody; thead; tfoot" },
  { attribute: "valign", elements: "tbody; thead; tfoot" },
  { attribute: "align", elements: "td; th" },
  { attribute: "bgcolor", elements: "td; th" },
  { attribute: "char", elements: "td; th" },
  { attribute: "charoff", elements: "td; th" },
  { attribute: "height", elements: "td; th" },
  { attribute: "nowrap", elements: "td; th" },
  { attribute: "valign", elements: "td; th" },
  { attribute: "width", elements: "td; th" },
  { attribute: "align", elements: "tr" },
  { attribute: "bgcolor", elements: "tr" },
  { attribute: "char", elements: "tr" },
  { attribute: "charoff", elements: "tr" },
  { attribute: "valign", elements: "tr" },
  { attribute: "compact", elements: "ul" },
  { attribute: "type", elements: "ul" },
  { attribute: "background", elements: "body; table; thead; tbody; tfoot; tr; td; th" }
]

// ============================================================
// Attributes that are required to be on particular elements
//
// http://www.w3.org/TR/html4/index/attributes.html
// http://www.w3.org/TR/html5-diff/#changed-attributes
//
// TODO: find a better, more comprehensive source for this
// ============================================================

var requiredAttributes = [
  { attributes: ["alt"], element: "area" },
  { attributes: ["height", "width"], element: "applet" },
  { attributes: ["dir"], element: "bdo" },
  { attributes: ["action"], element: "form" },
  { attributes: ["alt", "src"], element: "img" },
  { attributes: ["name"], element: "map" },
  { attributes: ["label"], element: "optgroup" },
  { attributes: ["name"], element: "param" },
  { attributes: ["cols", "rows"], element: "textarea" }
]

// ============================================================
// A complete list of valid elements in HTML. This is
// programatically generated form the elementData variable
// ============================================================

var elements = Object.keys(elementData).sort()

// TODO: memoize these functions

function elementName(element) {
  if (typeof element == "string")
    return element
  if (element.nodeType)
    return element.nodeName.toLowerCase()
}

function allowedAttributesForElement(element) {
  // return an empty array if the element is invalid
  if (elementData[element])
    return elementData[element].attributes.replace(/\*/g, "").split(/\s*;\s*/)
  else
    return []
}

function elementsForCategory(category) {
  return elementCategories[category].split(/\s*;\s*/)
}

function isGlobalAttribute(attribute) {
  return foundIn(attribute, globalAttributes)
}

function isWhitelistedElement(element) {
  return foundIn(element, spec.elementWhitelist)
}

function isWhitelistedAttribute(attribute) {
  return foundIn(attribute, spec.attributeWhitelist)
}

function getAllowedChildElements(parent) {
  var contents
    , contentModel = []

  // ignore children properties that contain an asterisk for now
  contents = elementData[parent].children
  contents = contents.indexOf("*") > -1 ? [] : contents.split(/\s*\;\s*/)

  // replace content categories with their elements
  contents.forEach(function(item) {
    if (elementCategories[item]) {
      contentModel = contentModel.concat(elementCategories[item].elements)
      contentModel = contentModel.concat(elementCategories[item].exceptions || [])
    } else {
      contentModel.push(item)
    }
  })
  // return a guaranteed match (to be safe) when there's no children
  return contentModel.length ? contentModel : [/[\s\S]+/]
}

var spec = {

  // This allows AngularJS's ng-* attributes to be allowed,
  // customize to fit your needs
  attributeWhitelist: [
    /ng\-[a-z\-]+/
  ],

  // Include any custom element you're using and want to allow
  elementWhitelist: [],

  isElementValid: function(element) {
    return isWhitelistedElement(element)
      ? true
      : elements.indexOf(element) >= 0
  },

  isElementObsolete: function(element) {
    return isWhitelistedElement(element)
      ? false
      : obsoluteElements.indexOf(element) >= 0
  },

  isAttributeValidForElement: function(attribute, element) {
    if (isGlobalAttribute(attribute) || isWhitelistedAttribute(attribute)) {
      return true
    }
    // some elements (like embed) accept any attribute
    // http://drafts.htmlwg.org/html/master/embedded-content-0.html#the-embed-element
    if (allowedAttributesForElement(element).indexOf("any") >= 0) return true
    return allowedAttributesForElement(element).indexOf(attribute) >= 0
  },

  isAttributeObsoleteForElement: function(attribute, element) {
    // attributes in the whitelist are never considered obsolete
    if (isWhitelistedAttribute(attribute)) return false

    return obsoleteAttributes.some(function(item) {
      if (item.attribute !== attribute) return false
      return item.elements.split(/\s*;\s*/).some(function(name) {
        return name === element
      })
    })
  },

  isAttributeRequiredForElement: function(attribute, element) {
    // attributes in the whitelist are never considered required
    if (isWhitelistedAttribute(attribute)) return false

    return requiredAttributes.some(function(item) {
      return element == item.element && item.attributes.indexOf(attribute) >= 0
    })
  },

  getRequiredAttributesForElement: function(element) {
    var filtered = requiredAttributes.filter(function(item) {
      return item.element == element
    })
    return (filtered[0] && filtered[0].attributes) || []
  },

  isChildAllowedInParent: function(child, parent) {
    // only check if both elements are valid elements
    if (!elementData[child] || !elementData[parent])
      return true
    else
      return foundIn(child, getAllowedChildElements(parent))
  }

}

//module.exports = {
//  name: "validation",
//  module: spec
//}

return spec;

});
