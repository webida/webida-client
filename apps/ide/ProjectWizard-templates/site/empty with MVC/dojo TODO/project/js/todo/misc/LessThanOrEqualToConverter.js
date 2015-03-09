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

define({
	// summary:
	//		A dojox/mvc data converter, that does one-way conversion that returns whether we have less than n todo items in a specific state, where n is the given number in data converter options.
	//		Data converter options can be specified by setting constraints property in one of data binding endpoints.
	//		See data converter section of dojox/mvc/sync library's documentation for more details.

	format: function(/*Number*/ value, /*Object*/ constraints){
		// summary:
		//		Returns whether given value is less than or equal to the given number in data converter options (default zero).

		return value <= (constraints.lessThanOrEqualTo || 0);
	},

	parse: function(/*Boolean*/ value){
		// summary:
		//		This functions throws an error so that the new value won't be reflected.

		throw new Error();
	}
});
