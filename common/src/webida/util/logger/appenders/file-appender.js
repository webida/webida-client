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

/**
 * FileAppender for Server Logger
 * @author hw.shim
 */

'use strict';

function FileAppender(logDir){
	this.logDir = logDir || './';
}
FileAppender.prototype.log = function(){
	this.write.apply(this, arguments);
};
FileAppender.prototype.info = function(){
	this.write.apply(this, arguments);
};
FileAppender.prototype.warn = function(){
	this.write.apply(this, arguments);
};
FileAppender.prototype.error = function(){
	this.write.apply(this, arguments);
};
FileAppender.prototype.trace = function(){
	this.write.apply(this, arguments);
};
FileAppender.prototype.write = function(){
	var fs = require('fs');
	var os = require('os');
	var msg = ([]).join.call(arguments,' ');
	fs.writeFileSync(this.logDir+'server.log', msg+os.EOL, {flag:'a'});
	//TODO Log rotate
};

module.exports = FileAppender;
