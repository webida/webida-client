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

var helper = require("./test-helper.js"),
	Stream = require("..").WritableStream,
	fs = require("fs"),
	path = require("path");

helper.mochaTest("Stream", __dirname, function(test, cb){
	var filePath = path.join(__dirname, "Documents", test.file);
	fs.createReadStream(filePath).pipe(
		new Stream(
			helper.getEventCollector(function(err, events){
				cb(err, events);

				var handler = helper.getEventCollector(cb),
				    stream = new Stream(handler, test.options);

				fs.readFile(filePath, function(err, data){
					if(err) throw err;
					else stream.end(data);
				});
			}
		), test.options)
	).on("error", cb);
});