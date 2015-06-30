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

describe("validate-elements", function() {

  var log

  function onComplete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when obsolete elements appear in the HTML", function() {

    var html = parseHTML(''
          + '<div>'
          + '  <hgroup>'
          + '     <h1>Title</h1>'
          + '     <h2>Subtitle</h2>'
          + '  </hgroup>'
          + '  <tt>Teletype text</tt>'
          + '  <center><p><b>Foo</b></p></center>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["validate-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(3)
    expect(log[0].message).to.equal("The <hgroup> element is obsolete and should not be used.")
    expect(log[0].context).to.equal(html.querySelector("hgroup"))
    expect(log[1].message).to.equal("The <tt> element is obsolete and should not be used.")
    expect(log[1].context).to.equal(html.querySelector("tt"))
    expect(log[2].message).to.equal("The <center> element is obsolete and should not be used.")
    expect(log[2].context).to.equal(html.querySelector("center"))

  })

  it("warns when invalid elements appear in the HTML", function() {

    var html = parseHTML(''
          + '<div>'
          + '  <foo>'
          + '     <h1>Title</h1>'
          + '     <h2>Subtitle</h2>'
          + '  </foo>'
          + '  <bar>Teletype text</bar>'
          + '  <bogus><p><b>Foo</b></p></bogus>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["validate-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(3)
    expect(log[0].message).to.equal("The <foo> element is not a valid HTML element.")
    expect(log[0].context).to.equal(html.querySelector("foo"))
    expect(log[1].message).to.equal("The <bar> element is not a valid HTML element.")
    expect(log[1].context).to.equal(html.querySelector("bar"))
    expect(log[2].message).to.equal("The <bogus> element is not a valid HTML element.")
    expect(log[2].context).to.equal(html.querySelector("bogus"))

  })

  it("doesn't double-warn when an element is both invalid and obsolete", function() {

    var html = parseHTML(''
          + '<hgroup>'
          + '   <h1>Title</h1>'
          + '   <h2>Subtitle</h2>'
          + '</hgroup>'
        )

    HTMLInspector.inspect({
      useRules: ["validate-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(1)
  })

  it("doesn't warn when valid, non-obsolete elements are used", function() {

    var html = parseHTML(''
          + '<div>'
          + '  <span>Foo</span>'
          + '  <p>Foo</p>'
          + '  <div><b>Foo</b></div>'
          + '</div>'
        )

    HTMLInspector.inspect({
      useRules: ["validate-elements"],
      domRoot: html,
      onComplete: onComplete
    })

    expect(log.length).to.equal(0)

  })

})