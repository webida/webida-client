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
  , Modules = require("../../src/modules")

describe("Modules", function() {

  var modules

  beforeEach(function() {
    modules = new Modules()
  })

  describe("#add", function() {
    it("can add a new module", function() {
      modules.add({
        name: "new-module",
        module: {}
      })
      expect(modules["new-module"]).to.exist
    })
  })

  describe("#extend", function() {
    it("can extend an existing module with an options object", function() {
      modules.add({
        name: "new-module",
        module: {foo: "bar"}
      })
      modules.extend("new-module", {fizz: "buzz"})
      expect(modules["new-module"]).to.deep.equal({foo:"bar", fizz:"buzz"})
    })
    it("can extend an existing module with a function that returns an options object", function() {
      modules.add({
        name: "new-module",
        module: {list: [1]}
      })
      modules.extend("new-module", function() {
        this.list.push(2)
        this.foo = "bar"
        return this
      })
      expect(modules["new-module"]).to.deep.equal({list:[1, 2], foo:"bar"})
    })
  })
})
