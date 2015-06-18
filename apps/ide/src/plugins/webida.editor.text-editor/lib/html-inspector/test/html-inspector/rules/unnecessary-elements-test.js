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

describe("unnecessary-elements", function() {

  var log

  function onComplete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when unattributed <div> or <span> elements appear in the HTML", function() {
    var html = parseHTML(''
          + '<div>'
          + '  <span>Foo</span>'
          + '  <p>Foo</p>'
          + '  <div><b>Foo</b></div>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["unnecessary-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(3)
    expect(log[0].message).to.equal("Do not use <div> or <span> elements without any attributes.")
    expect(log[1].message).to.equal("Do not use <div> or <span> elements without any attributes.")
    expect(log[2].message).to.equal("Do not use <div> or <span> elements without any attributes.")
    expect(log[0].context).to.equal(html)
    expect(log[1].context).to.equal(html.querySelector("span"))
    expect(log[2].context).to.equal(html.querySelector("div"))

  })

  it("doesn't warn when attributed <div> or <span> elements appear in the HTML", function() {
    var html = parseHTML(''
          + '<div data-foo="bar">'
          + '  <span class="alert">Foo</span>'
          + '  <p>Foo</p>'
          + '  <div><b>Foo</b></div>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["unnecessary-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(1)
    expect(log[0].message).to.equal("Do not use <div> or <span> elements without any attributes.")
    expect(log[0].context).to.equal(html.querySelector("div"))

  })

  it("doesn't warn when unattributed, semantic elements appear in the HTML", function() {
    var html = parseHTML(''
          + '<section data-foo="bar">'
          + '  <h1>Foo</h1>'
          + '  <p>Foo</p>'
          + '</section>'
        )

    HTMLInspector.inspect({
      useRules: ["unnecessary-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(0)

  })

  it("allows for customization by altering the config object", function() {
    var html = parseHTML(''
          + '<div>'
          + '  <h1>Foo</h1>'
          + '  <span>Foo</span>'
          + '</div>'
        )
    HTMLInspector.rules.extend("unnecessary-elements", {
      isUnnecessary: function(element) {
        return element.nodeName === "SPAN"
      }
    })
    HTMLInspector.inspect({
      useRules: ["unnecessary-elements"],
      domRoot: html,
      onComplete: onComplete
    })
    expect(log.length).to.equal(1)
    expect(log[0].context).to.equal(html.querySelector("span"))

  })

})
