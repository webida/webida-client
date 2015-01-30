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

describe("script-placement", function() {

  var log

  function onComplete(reports) {
    log = []
    reports.forEach(function(report) {
      log.push(report)
    })
  }

  it("warns when script tags aren't found as the last elemenet in <body>", function() {
    HTMLInspector.inspect({
      useRules: ["script-placement"],
      onComplete: onComplete
    })
    expect(log.length).to.be.above(0)
    log.forEach(function(error, i) {
      expect(log[i].message).to.equal("<script> elements should appear right before the closing </body> tag for optimal performance.")
      expect(log[i].context.nodeName.toLowerCase()).to.equal("script")
    })

    var body = document.createElement("body")
    body.appendChild(parseHTML('<script id="script1">(function() { // script one }())</script>'))
    body.appendChild(parseHTML('<header>Header content</header>'))
    body.appendChild(parseHTML('<main>Main content</main>'))
    body.appendChild(parseHTML('<footer>Footer content</footer>'))
    body.appendChild(parseHTML('<script id="script2">(function() { // script two }())</script>'))
    body.appendChild(parseHTML('<script id="script3">(function() { // script three }())</script>'))

    // Make sure the scripts aren't async or defer
    Array.prototype.slice.call(body.querySelectorAll("script")).forEach(function(script) {
      script.async = false
      script.defer = false
    })

    HTMLInspector.inspect({
      useRules: ["script-placement"],
      domRoot: body,
      onComplete: onComplete
    })

    expect(log.length).to.equal(1)
    expect(log[0].message).to.equal("<script> elements should appear right before the closing </body> tag for optimal performance.")
    expect(log[0].context).to.equal(body.querySelector("#script1"))
  })

  it("doesn't warn when script tags are the last traversed element", function() {
    var body = document.createElement("body")
    body.appendChild(parseHTML('<header>Header content</header>'))
    body.appendChild(parseHTML('<main>Main content</main>'))
    body.appendChild(parseHTML('<footer>Footer content</header>'))
    body.appendChild(parseHTML('<script id="script1">(function() { // script one }())</script>'))
    body.appendChild(parseHTML('<script id="script2">(function() { // script two }())</script>'))

    HTMLInspector.inspect({
      useRules: ["script-placement"],
      domRoot: body,
      onComplete: onComplete
    })
    expect(log.length).to.equal(0)
  })

  it("doesn't warn when the script uses either the async or defer attribute", function() {
    var body = document.createElement("body")
    body.appendChild(parseHTML('<script id="script1" async>(function() { // script one }())</script>'))
    body.appendChild(parseHTML('<script id="script2" defer>(function() { // script two }())</script>'))
    body.appendChild(parseHTML('<header>Header content</header>'))
    body.appendChild(parseHTML('<main>Main content</main>'))
    body.appendChild(parseHTML('<footer>Footer content</header>'))

    HTMLInspector.inspect({
      useRules: ["script-placement"],
      domRoot: body,
      onComplete: onComplete
    })
    expect(log.length).to.equal(0)

  })

  it("allows for customization by altering the config object", function() {
    var body = document.createElement("body")
    body.appendChild(parseHTML('<script id="script1">(function() { // script one }())</script>'))
    body.appendChild(parseHTML('<script id="script2">(function() { // script two }())</script>'))
    body.appendChild(parseHTML('<header>Header content</header>'))
    body.appendChild(parseHTML('<main>Main content</main>'))
    body.appendChild(parseHTML('<footer>Footer content</header>'))
    body.appendChild(parseHTML('<script id="script3">(function() { // script three }())</script>'))

    // Make sure the scripts aren't async or defer
    Array.prototype.slice.call(body.querySelectorAll("script")).forEach(function(script) {
      script.async = false
      script.defer = false
    })

    // whitelist #script1
    HTMLInspector.rules.extend("script-placement", {
      whitelist: "#script1"
    })
    HTMLInspector.inspect({
      useRules: ["script-placement"],
      domRoot: body,
      onComplete: onComplete
    })
    expect(log.length).to.equal(1)
    expect(log[0].message).to.equal("<script> elements should appear right before the closing </body> tag for optimal performance.")
    expect(log[0].context).to.equal(body.querySelector("#script2"))

    // whitelist #script1 and #script2
    HTMLInspector.rules.extend("script-placement", {
      whitelist: ["#script1", "#script2"]
    })
    HTMLInspector.inspect({
      useRules: ["script-placement"],
      domRoot: body,
      onComplete: onComplete
    })
    expect(log.length).to.equal(0)
  })
})