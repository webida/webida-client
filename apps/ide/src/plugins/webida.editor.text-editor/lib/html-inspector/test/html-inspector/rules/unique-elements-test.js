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

describe("unique-elements", function() {

  var log

  function onComplete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when single-use elements appear on the page more than once", function() {
    var html = parseHTML(''
          + '<div>'
          + '  <div>'
          + '    <title>Foobar</title>'
          + '  </div>'
          + '  <div>'
          + '    <title>Foobar</title>'
          + '  </div>'
          + '  <header>Page Header</header>'
          + '  <header>Page Header</header>'
          + '  <main>Main content</main>'
          + '  <main>More main content</main>'
          + '  <footer>Footer content</header>'
          + '  <footer>Footer content</header>'
          + '</div>'
        )
    HTMLInspector.inspect({
      useRules: ["unique-elements"],
      domRoot: html,
      onComplete: onComplete
    })
    expect(log.length).to.equal(2)
    expect(log[0].message).to.equal("The <title> element may only appear once in the document.")
    expect(log[1].message).to.equal("The <main> element may only appear once in the document.")
    expect(log[0].context).to.deep.equal([html.querySelector("title"), html.querySelectorAll("title")[1]])
    expect(log[1].context).to.deep.equal([html.querySelector("main"), html.querySelectorAll("main")[1]])
  })

  it("doesn't warn when single-use elements appear on the page only once", function() {
    var html = parseHTML(''
          + '<html>'
          + '  <head>'
          + '    <title>Foobar</title>'
          + '  </head>'
          + '  <body>'
          + '    <header>Header content</header>'
          + '    <main>Main content</main>'
          + '    <footer>Footer content</header>'
          + '  </body>'
          + '</html>'
        )
    HTMLInspector.inspect({
      useRules: ["unique-elements"],
      domRoot: html,
      onComplete: onComplete
    })
    expect(log.length).to.equal(0)
  })

  it("allows for customization by altering the config object", function() {
    var html = parseHTML(''
          + '<div>'
          + '  <div>'
          + '    <title>Foobar</title>'
          + '  </div>'
          + '  <div>'
          + '    <title>Foobar</title>'
          + '  </div>'
          + '  <header>Page Header</header>'
          + '  <header>Page Header</header>'
          + '  <main>Main content</main>'
          + '  <main>More main content</main>'
          + '  <footer>Footer content</header>'
          + '  <footer>Footer content</header>'
          + '</div>'
        )
    HTMLInspector.rules.extend("unique-elements", {
      elements: ["header", "footer"]
    })
    HTMLInspector.inspect({
      useRules: ["unique-elements"],
      domRoot: html,
      onComplete: onComplete
    })
    expect(log.length).to.equal(2)
    expect(log[0].message).to.equal("The <header> element may only appear once in the document.")
    expect(log[1].message).to.equal("The <footer> element may only appear once in the document.")
    expect(log[0].context).to.deep.equal([html.querySelector("header"), html.querySelectorAll("header")[1]])
    expect(log[1].context).to.deep.equal([html.querySelector("footer"), html.querySelectorAll("footer")[1]])
  })
})