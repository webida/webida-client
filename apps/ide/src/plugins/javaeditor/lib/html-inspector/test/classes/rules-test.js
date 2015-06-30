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

var expect = require("chai").expect
  , Rules = require("../../src/rules")

describe("Rules", function() {

  var rules
    , fn = function() { }

  beforeEach(function() {
    rules = new Rules()
  })

  describe("#add", function() {
    it("can add a new rule", function() {
      var config = { foo:"bar" }
      rules.add({
        name: "new-rule",
        config: config,
        func: fn
      })
      expect(rules["new-rule"]).to.exist
      expect(rules["new-rule"].config).to.equal(config)
      expect(rules["new-rule"].func).to.equal(fn)
    })
    it("can accept arguments in multiple formats", function() {
      var config = { foo:"bar" }
      // as individual arguments rather than a single object
      rules.add("new-rule", config, fn)
      expect(rules["new-rule"]).to.exist
      expect(rules["new-rule"].config).to.deep.equal(config)
      expect(rules["new-rule"].func).to.equal(fn)
      // as individual arguments without a config object
      rules.add("newer-rule", fn)
      expect(rules["newer-rule"]).to.exist
      expect(rules["newer-rule"].config).to.deep.equal({})
      expect(rules["newer-rule"].func).to.equal(fn)
    })
  })

  describe("#extend", function() {
    it("can extend an existing rule with an options object", function() {
      var config = {foo: "bar"}
      rules.add({
        name: "new-rule",
        config: config,
        func: fn
      })
      rules.extend("new-rule", {fizz: "buzz"})
      expect(rules["new-rule"].config).to.deep.equal({foo:"bar", fizz:"buzz"})
    })
    it("can extend an existing rule with a function that returns an options object", function() {
      var config = {list: [1]}
      rules.add({
        name: "new-rule",
        config: config,
        func: fn
      })
      rules.extend("new-rule", function(config) {
        config.list.push(2)
        return config
      })
      expect(rules["new-rule"].config).to.deep.equal({list:[1, 2]})
      rules.extend("new-rule", function(config) {
        this.foo = "bar"
        return this
      })
      expect(rules["new-rule"].config).to.deep.equal({list:[1, 2], foo:"bar"})
    })
  })
})
