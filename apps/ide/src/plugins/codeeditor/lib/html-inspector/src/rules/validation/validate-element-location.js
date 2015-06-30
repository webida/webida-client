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

module.exports = {

  name: "validate-element-location",

  func: function(listener, reporter) {

    var validation = this.modules.validation
      , matches = require("dom-utils/src/matches")
      , parents = require("dom-utils/src/parents")
      , warned = [] // store already-warned elements to prevent double warning


    // ===========================================================================
    // Elements with clear-cut location rules are tested here.
    // More complicated cases are tested below
    // ===========================================================================

    listener.on("element", function(name) {
      // skip elements without a DOM element for a parent
      if (!(this.parentNode && this.parentNode.nodeType == 1)) return

      var child = name
        , parent = this.parentNode.nodeName.toLowerCase()

      if (!validation.isChildAllowedInParent(child, parent)) {
        warned.push(this)
        reporter.warn(
          "validate-element-location",
          "The <" + child + "> element cannot be a child of the <" + parent + "> element.",
          this
        )
      }
    })

    // ===========================================================================
    // Make sure <style> elements inside <body> have the 'scoped' attribute.
    // They must also be the first element child of their parent.
    // ===========================================================================

    listener.on("element", function(name) {
      // don't double warn if the style elements already has a location warning
      if (warned.indexOf(this) > -1) return

      if (matches(this, "body style:not([scoped])")) {
        reporter.warn(
          "validate-element-location",
          "<style> elements inside <body> must contain the 'scoped' attribute.",
          this
        )
      }
      else if (matches(this, "body style[scoped]:not(:first-child)")) {
        reporter.warn(
          "validate-element-location",
          "Scoped <style> elements must be the first child of their parent element.",
          this
        )
      }

    })

    // ===========================================================================
    // Make sure <meta> and <link> elements inside <body> have the 'itemprop'
    // attribute
    // ===========================================================================

    listener.on("element", function(name) {
      // don't double warn if the style elements already has a location warning
      if (warned.indexOf(this) > -1) return

      if (matches(this, "body meta:not([itemprop]), body link:not([itemprop])")) {
        reporter.warn(
          "validate-element-location",
          "<" + name + "> elements inside <body> must contain the"
          + " 'itemprop' attribute.",
          this
        )
      }
    })
  }
}
