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

describe("unused-classes", function() {

  var log

  function onComplete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when non-whitelisted classes appear in the HTML but not in any stylesheet", function() {
    var html = parseHTML(''
          + '<div class="fizz buzz">'
          + '  <p class="foo bar baz">This is just a test</p>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["unused-classes"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log[0].message).to.equal("The class 'fizz' is used in the HTML but not found in any stylesheet.")
    expect(log[1].message).to.equal("The class 'buzz' is used in the HTML but not found in any stylesheet.")
    expect(log[2].message).to.equal("The class 'baz' is used in the HTML but not found in any stylesheet.")
    expect(log[0].context).to.equal(html)
    expect(log[1].context).to.equal(html)
    expect(log[2].context).to.equal(html.querySelector("p"))

  })

  it("doesn't warn when whitelisted classes appear in the HTML", function() {
    var html = parseHTML(''
          + '<div class="supports-flexbox">'
          + '  <p class="js-alert">This is just a test</p>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["unused-classes"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(0)

  })

  it("allows for customization by altering the config object", function() {

    var html = parseHTML(''
          + '<div class="fizz supports-flexbox">'
          + '  <p class="js-alert buzz">This is just a test</p>'
          + '</div>'
        )

    // the whitelist can be a single RegExp
    HTMLInspector.rules.extend("unused-classes", {whitelist: /fizz|buzz/})

    HTMLInspector.inspect({
      useRules: ["unused-classes"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(2)
    expect(log[0].message).to.equal("The class 'supports-flexbox' is used in the HTML but not found in any stylesheet.")
    expect(log[1].message).to.equal("The class 'js-alert' is used in the HTML but not found in any stylesheet.")

    log = []
    // It can also be a list of strings or RegExps
    HTMLInspector.rules.extend("unused-classes", {whitelist: ["fizz", /buz\w/]})

    HTMLInspector.inspect({
      useRules: ["unused-classes"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(2)
    expect(log[0].message).to.equal("The class 'supports-flexbox' is used in the HTML but not found in any stylesheet.")
    expect(log[1].message).to.equal("The class 'js-alert' is used in the HTML but not found in any stylesheet.")

  })

})
