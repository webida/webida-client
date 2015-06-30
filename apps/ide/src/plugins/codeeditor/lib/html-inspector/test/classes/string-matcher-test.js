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
  , foundIn = require("../../src/utils/string-matcher")

describe("foundIn", function() {
  it("matches a string against a string, RegExp, or list of strings/RegeExps", function() {
    expect(foundIn("foo", "foo")).to.equal(true)
    expect(foundIn("foo", /^fo\w/)).to.equal(true)
    expect(foundIn("foo", [/\d+/, /^fo\w/])).to.equal(true)
    expect(foundIn("foo", ["fo", "f", /foo/])).to.equal(true)
    expect(foundIn("bar", "foo")).to.equal(false)
    expect(foundIn("bar", /^fo\w/)).to.equal(false)
    expect(foundIn("bar", [/\d+/, /^fo\w/])).to.equal(false)
    expect(foundIn("bar", ["fo", "f", /foo/])).to.equal(false)
  })
})
