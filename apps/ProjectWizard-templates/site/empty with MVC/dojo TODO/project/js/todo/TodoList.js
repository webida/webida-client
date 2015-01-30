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
	"dojo/_base/declare",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojox/mvc/WidgetList",
	"dojox/mvc/_InlineTemplateMixin",
	"todo/CssToggleWidget",
	"todo/ctrl/_HashCompletedMixin"
], function(declare, _TemplatedMixin, _WidgetsInTemplateMixin, WidgetList, _InlineTemplateMixin, CssToggleWidget, _HashCompletedMixin){
	return declare([WidgetList, _InlineTemplateMixin], {
		childClz: declare([CssToggleWidget,  _TemplatedMixin, _WidgetsInTemplateMixin, _HashCompletedMixin], {
			_setCompletedAttr: {type: "classExists", className: "completed"},
			_setHiddenAttr: {type: "classExists", className: "hidden"},

			onRemoveClick: function(){
				this.parent.listCtrl.removeItem(this.uniqueId);
			},

			onEditBoxChange: function(){
				if(!this.editBox.value){
					this.parent.listCtrl.removeItem(this.uniqueId);
				}
			}
		})
	});
});
