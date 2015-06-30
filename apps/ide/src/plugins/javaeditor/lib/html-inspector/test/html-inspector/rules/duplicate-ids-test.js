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

describe("duplicate-ids", function() {

  var log

  function onComplete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when the same ID attribute is used more than once", function() {
    var html = parseHTML(''
          + '<div id="foobar">'
          + '  <p id="foobar">Foo</p>'
          + '  <p id="barfoo">bar <em id="barfoo">Em</em></p>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["duplicate-ids"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(2)
    expect(log[0].message).to.equal("The id 'foobar' appears more than once in the document.")
    expect(log[1].message).to.equal("The id 'barfoo' appears more than once in the document.")
    expect(log[0].context).to.deep.equal([html, html.querySelector("p#foobar")])
    expect(log[1].context).to.deep.equal([html.querySelector("p#barfoo"), html.querySelector("em#barfoo")])

  })

  it("doesn't warn when all ids are unique", function() {
    var html = parseHTML(''
          + '<div id="foobar1">'
          + '  <p id="foobar2">Foo</p>'
          + '  <p id="barfoo1">Bar <em id="barfoo2">Em</em></p>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["duplicate-ids"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(0)
  })

})
