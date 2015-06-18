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

  name: "duplicate-ids",

  func: function(listener, reporter) {

    var elements = []

    listener.on("id", function(name) {
      elements.push({id: name, context: this})
    })

    listener.on("afterInspect", function() {

      var duplicates = []
        , element
        , offenders

      while (element = elements.shift()) {
        // find other elements with the same ID
        duplicates = elements.filter(function(el) {
          return element.id === el.id
        })
        // remove elements with the same ID from the elements array
        elements = elements.filter(function(el) {
          return element.id !== el.id
        })
        // report duplicates
        if (duplicates.length) {
          offenders = [element.context].concat(duplicates.map(function(dup) {
            return dup.context
          }))
          reporter.warn(
            "duplicate-ids",
            "The id '" + element.id + "' appears more than once in the document.",
            offenders
          )
        }
      }
    })
  }
}
