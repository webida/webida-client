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

  name: "script-placement",

  config: {
    whitelist: []
  },

  func: function(listener, reporter, config) {

    var elements = []
      , whitelist = config.whitelist
      , matches = require("dom-utils/src/matches")

    function isWhitelisted(el) {
      if (!whitelist) return false
      if (typeof whitelist == "string") return matches(el, whitelist)
      if (Array.isArray(whitelist)) {
        return whitelist.length && whitelist.some(function(item) {
          return matches(el, item)
        })
      }
      return false
    }

    listener.on("element", function(name) {
      elements.push(this)
    })

    listener.on("afterInspect", function() {
      var el
      // scripts at the end of the elements are safe
      while (el = elements.pop()) {
        if (el.nodeName.toLowerCase() != "script") break
      }
      elements.forEach(function(el) {
        if (el.nodeName.toLowerCase() == "script") {
          // scripts with the async or defer attributes are safe
          if (el.async === true || el.defer === true) return
          // at this point, if the script isn't whitelisted, throw an error
          if (!isWhitelisted(el)) {
            reporter.warn(
              "script-placement",
              "<script> elements should appear right before "
              + "the closing </body> tag for optimal performance.",
              el
            )
          }
        }
      })
    })
  }
}