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

var fs = require("fs"),
    path = require("path"),
    assert = require("assert"),
    util = require("util"),
    ElementType = require("domelementtype"),
    Parser = require("htmlparser2").Parser,
    Handler = require("../");

var basePath = path.resolve(__dirname, "cases"),
    inspectOpts = { showHidden: true, depth: null };

fs
.readdirSync(basePath)
.filter(RegExp.prototype.test, /\.json$/) //only allow .json files
.map(function(name){
	return path.resolve(basePath, name);
})
.map(require)
.forEach(function(test){
	it(test.name, function(){
		var expected = test.expected;

		var handler = new Handler(function(err, actual){
			assert.ifError(err);
			try {
				compare(expected, actual);
			} catch(e){
				e.expected = util.inspect(expected, inspectOpts);
				e.actual   = util.inspect(actual,   inspectOpts);
				throw e;
			}
		}, test.options);

		var data = test.html;

		var parser = new Parser(handler, test.options);

		//first, try to run the test via chunks
		for(var i = 0; i < data.length; i++){
			parser.write(data.charAt(i));
		}
		parser.done();

		//then parse everything
		parser.parseComplete(data);
	});
});

function compare(expected, result){
	assert.equal(typeof expected, typeof result, "types didn't match");
	if(typeof expected !== "object" || expected === null){
		assert.strictEqual(expected, result, "result doesn't equal expected");
	} else {
		for(var prop in expected){
			assert.ok(prop in result, "result didn't contain property " + prop);
			compare(expected[prop], result[prop]);
		}
	}
}