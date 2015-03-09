// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../mode/css/css"), require("underscore"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../mode/css/css", "other-lib/underscore/lodash.min"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  var pseudoClasses = {link: 1, visited: 1, active: 1, hover: 1, focus: 1,
                       "first-letter": 1, "first-line": 1, "first-child": 1,
                       before: 1, after: 1, lang: 1};

  function getHints(cm) {
    var cur = cm.getCursor(), token = cm.getTokenAt(cur);
    var inner = CodeMirror.innerMode(cm.getMode(), token.state);
    if (inner.mode.name != "css") return;

    var start = token.start, end = cur.ch, word = token.string.slice(0, end - start);
    if (/[^\w$_-]/.test(word)) {
      word = ""; start = end = cur.ch;
    }

    var spec = CodeMirror.resolveMode("text/css");

    function commonstring(str, sub) {
      function calculateCommon(strP, subP) {
        if (subP < sub.length) {
          var n = str.substring(strP).indexOf(sub.charAt(subP));
          if (n < 0) { return; }
          var p = 1;
          while (subP + p < sub.length && str.charAt(strP + n + p) === (sub.charAt(subP + p))) {
            p++;
          }
          if (subP + p >= sub.length) {
            return [{start: strP + n, len: p}];
          } else {
            var rest = calculateCommon(strP + n + p, subP + p);
            if (rest) {
              rest.push({start: strP + n, len: p});
              return rest;
            }
          }
        }
      }
      function calculateRelevance(common) {
        var mcp = _.max(common, function (c) { return c.len; });
        var rel = mcp.len - str.length - mcp.len;
        return rel;
      }
      var common = calculateCommon(0, 0);
      if (common) {
        return (function (str, sub, common) {
          var render = function (elem /*, self, data*/) {
            var e = $(elem).html('');
            function appendNormal(e, str) {
              e.append($('<span>').text(str));
            }
            function appendBold(e, str) {
              e.append($('<span class="CodeMirror-hint-common-string">').text(str));
            }
            var first = _.first(common);
            if (first.start > 0) {
              appendNormal(e, str.substring(0, first.start));
            }
            for (var i = 0; i < common.length; i++) {
              var self = common[i];
              if (i > 0) {
                var prev = common[i - 1];
                appendNormal(e, str.substring(prev.start + prev.len, self.start));
              }
              appendBold(e, str.substr(self.start, self.len));
            }
            var last = _.last(common);
            if (last.start + last.len < str.length) {
              appendNormal(e, str.substring(last.start + last.len));
            }
          };
          return {
            render: render,
            relevance: calculateRelevance(common)
          };
        })(str, sub, common.reverse());
      }
    }

    var tstr = word.toLowerCase();
    var result = [];
    var allKeywords = [];
    function add(keywords) {
      allKeywords = _.union(allKeywords, keywords);
      for (var name in keywords) {
        var renderer = commonstring(name, tstr);
        if (renderer) {
          result.push({
            text: name,
            render: renderer.render,
            relevance: renderer.relevance
          });
        }
      }
    }

    var st = inner.state.state;
    if (st == "pseudo" || token.type == "variable-3") {
      add(pseudoClasses);
    } else if (st == "block" || st == "maybeprop") {
      add(spec.propertyKeywords);
    } else if (st == "prop" || st == "parens" || st == "at" || st == "params") {
      add(spec.valueKeywords);
      add(spec.colorKeywords);
    } else if (st == "media" || st == "media_parens") {
      add(spec.mediaTypes);
      add(spec.mediaFeatures);
    }

    result = _.sortBy(result, function (item) { return -item.relevance; });

    if (! _.isEmpty(result)) {
      return {
        list: result,
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)
      };
    } else {
      return {
        list: allKeywords,
        from: cur,
        to: cur
      };
    }
  }

  function getHints2(cm, callback) {
    if (typeof callback !== 'function') {
      callback = null;
    }

    var data = getHints(cm);

    if (callback) {
      callback(data);
    } else {
      return data;
    }
  }

  CodeMirror.registerHelper("hint", "css", getHints2);
});
