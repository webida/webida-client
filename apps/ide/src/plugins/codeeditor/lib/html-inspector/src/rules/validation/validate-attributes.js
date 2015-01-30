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

  name: "validate-attributes",

  func: function(listener, reporter) {

    var validation = this.modules.validation

    listener.on("element", function(name) {
      var required = validation.getRequiredAttributesForElement(name)
      required.forEach(function(attr) {
        if (!this.hasAttribute(attr)) {
          reporter.warn(
            "validate-attributes",
            "The '" + attr + "' attribute is required for <"
            + name + "> elements.",
            this
          )
        }
      }, this)
    })

    listener.on("attribute", function(name) {
      var element = this.nodeName.toLowerCase()

      // don't validate the attributes of invalid elements
      if (!validation.isElementValid(element)) return

      if (validation.isAttributeObsoleteForElement(name, element)) {
        reporter.warn(
          "validate-attributes",
          "The '" + name + "' attribute is no longer valid on the <"
          + element + "> element and should not be used.",
          this
        )
      }
      else if (!validation.isAttributeValidForElement(name, element)) {
        reporter.warn(
          "validate-attributes",
          "'" + name + "' is not a valid attribute of the <"
          + element + "> element.",
          this
        )
      }
    })
  }
}
