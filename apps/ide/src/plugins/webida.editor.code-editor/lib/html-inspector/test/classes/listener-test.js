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
  , assert = require("chai").assert
  , sinon = require("sinon")
  , Listener = require("../../src/listener")
  , noop = function() { }

describe("Listener", function() {

  describe("#on", function() {
    it("can add handlers to a specific event", function() {
      var listener = new Listener()
      listener.on("foo", noop)
      listener.on("bar", noop)
      expect(listener._events.foo).to.exist
      expect(listener._events.bar).to.exist
    })
  })

  describe("#trigger", function() {
    it("can trigger handlers on a specific event", function() {
      var listener = new Listener()
        , spy = sinon.spy()
      listener.on("foo", spy)
      listener.on("bar", spy)
      listener.trigger("foo")
      listener.trigger("bar")
      assert(spy.calledTwice)
    })
  })

  describe("#off", function() {
    it("can remove handlers from a specific event", function() {
      var listener = new Listener()
        , spy = sinon.spy()
      listener.on("foo", spy)
      listener.on("bar", spy)
      listener.off("foo", spy)
      listener.off("bar", spy)
      listener.trigger("foo")
      listener.trigger("bar")
      expect(spy.called).to.be.false
    })
  })

})