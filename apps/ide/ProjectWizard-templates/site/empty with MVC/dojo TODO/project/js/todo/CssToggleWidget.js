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

define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dijit/_WidgetBase"
], function(array, declare, lang, domClass, _WidgetBase){
	return declare(_WidgetBase, {
		// summary:
		//		Widget supporting widget attributes with classExists type.
		//		classExists type allows boolean value of an attribute to reflect existence of a CSS class in a DOM node in the widget.
		// example:
		//		In this example, the text will be bold when the check box is checked.
		// |		<html>
		// |			<head>
		// |				<script src="/path/to/dojo-toolkit/dojo/dojo.js" type="text/javascript"
		// |				 data-dojo-config="parseOnLoad: 1,
		// |				                   packages: [{name: 'todo', location: '/path/to/todo-package'}],
		// |				                   deps: ['dojo/parser', 'dojo/domReady!']"></script>
		// |				<style type="text/css">
		// |					.boldText {
		// |						font-weight: bold;
		// |					}
		// |				</style>
		// |			</head>
		// |			<body>
		// |				<script type="dojo/require">at: "dojox/mvc/at"</script>
		// |				<input id="checkbox" data-dojo-type="dijit/form/CheckBox">
		// |				<div data-dojo-type="todo/CssToggleWidget"
		// |				 data-dojo-props="_setBoldAttr: {type: 'classExists', className: 'boldText'},
		// |				                  bold: at('widget:checkbox', 'checked')">This text will be bold when above check box is checked.</div>
		// |			</body>
		// |		</html>

		_attrToDom: function(/*String*/ attr, /*String*/ value, /*Object?*/ commands){
			// summary:
			//		Handle widget attribute with classExists type.
			//		See dijit/_WidgetBase._attrToDom() for more details.

			var callee = arguments.callee;
			array.forEach((function(){ return lang.isArray(commands) ? commands.slice(0) : [commands]; })(arguments.length >= 3 ? commands : this.attributeMap[attr]), function(command){
				command.type != "classExists" ?
				 this.inherited("_attrToDom", lang.mixin([attr, value, command], {callee: callee})) :
				 domClass.toggle(this[command.node || "domNode"], command.className || attr, value);
			}, this);
		}
	});
});
