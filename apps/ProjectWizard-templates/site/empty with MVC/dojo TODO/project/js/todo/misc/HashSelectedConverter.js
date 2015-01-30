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
	//		A dojox/mvc data converter, that runs between todo/ctrl/HashController and a widget having <a> tag as its DOM node.
	//		It does one-way conversion from URL hash to boolean state of whether the URL hash matches href attribute of the widget's DOM node.

	format: function(/*String*/ value){
		// summary:
		//		Returns whether given value matches href attribute of the widget's DOM node.

		return this.target.domNode.getAttribute("href").substr(1) == (value || "/");
	},

	parse: function(/*Boolean*/ value){
		// summary:
		//		This functions throws an error so that the new value won't be reflected.

		throw new Error();
	}
});
