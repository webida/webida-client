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

var htmlparser2 = require(".."),
    fs = require("fs"),
    path = require("path"),
    assert = require("assert"),
	Parser = htmlparser2.Parser,
	CollectingHandler = htmlparser2.CollectingHandler;

exports.writeToParser = function(handler, options, data){
	var parser = new Parser(handler, options);
	//first, try to run the test via chunks
	for(var i = 0; i < data.length; i++){
		parser.write(data.charAt(i));
	}
	parser.end();
	//then parse everything
	parser.parseComplete(data);
};

//returns a tree structure
exports.getEventCollector = function(cb){
	var handler = new CollectingHandler({onerror: cb, onend: function(){
		cb(null, handler.events.reduce(eventReducer, []));
	}});

	return handler;
};

function eventReducer(events, arr){
	if(arr[0] === "onerror" || arr[0] === "onend");
	else if(arr[0] === "ontext" && events.length && events[events.length-1].event === "text"){
		events[events.length-1].data[0] += arr[1];
	} else {
		events.push({
			event: arr[0].substr(2),
			data: arr.slice(1)
		});
	}

	return events;
}

function getCallback(expected, done){
	var repeated = false;

	return function(err, actual){
		assert.ifError(err);
		try {
			assert.deepEqual(expected, actual, "didn't get expected output");
		} catch(e){
			e.expected = JSON.stringify(expected, null, 2);
			e.actual = JSON.stringify(actual, null, 2);
			throw e;
		}

		if(repeated) done();
		else repeated = true;
	};
}

exports.mochaTest = function(name, root, test){
	describe(name, readDir);

	function readDir(cb){
		var dir = path.join(root, name);

		fs
		.readdirSync(dir)
		.filter(RegExp.prototype.test, /^[^\._]/) //ignore all files with a leading dot or underscore
		.map(function(name){
			return path.join(dir, name);
		})
		.map(require)
		.forEach(runTest);
	}

	function runTest(file){
		it(file.name, function(done){
			test(file, getCallback(file.expected, done));
		});
	}
};