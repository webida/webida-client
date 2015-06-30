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

var reClassSelector = /\.[a-z0-9_\-]+/ig
  , toArray = require("mout/lang/toArray")
  , unique = require("mout/array/unique")
  , matches = require("dom-utils/src/matches")

/**
 * Get an array of class selectors from a CSSRuleList object
 */
function getClassesFromRuleList(rulelist) {
  return rulelist.reduce(function(classes, rule) {
    var matches
    if (rule.styleSheet) { // from @import rules
      return classes.concat(getClassesFromStyleSheets([rule.styleSheet]))
    }
    else if (rule.cssRules) { // from @media rules (or other conditionals)
      return classes.concat(getClassesFromRuleList(toArray(rule.cssRules)))
    }
    else if (rule.selectorText) {
      matches = rule.selectorText.match(reClassSelector) || []
      return classes.concat(matches.map(function(cls) { return cls.slice(1) } ))
    }
    return classes
  }, [])
}

/**
 * Get an array of class selectors from a CSSSytleSheetList object
 */
function getClassesFromStyleSheets(styleSheets) {
  return styleSheets.reduce(function(classes, sheet) {
    return classes.concat(getClassesFromRuleList(toArray(sheet.cssRules)))
  }, [])
}

function getStyleSheets() {
  return toArray(document.styleSheets).filter(function(sheet) {
    return matches(sheet.ownerNode, css.styleSheets)
  })
}

var css = {
  getClassSelectors: function() {
    return unique(getClassesFromStyleSheets(getStyleSheets()))
  },
  // getSelectors: function() {
  //   return []
  // },
  styleSheets: 'link[rel="stylesheet"], style'
}

module.exports = {
  name: "css",
  module: css
}
