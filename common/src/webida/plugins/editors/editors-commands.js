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
	'./plugin', 
	'webida-lib/plugins/workbench/plugin', 
	'webida-lib/widgets/views/viewmanager', 
	'dojo/topic', 
	'external/lodash/lodash.min'
], function(
	editors, 
	workbench, 
	vm, 
	topic, 
	_
) {'use strict';

	function undo() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// undo
			editor.undo();
		}
	}

	function redo() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// redo
			editor.redo();
		}
	}

	function scrollToCursor(cm, position) {
		var lineNum = cm.getCursor().line;
		var charCoords = cm.charCoords({
			line : lineNum,
			ch : 0
		}, 'local');
		var height = cm.getScrollInfo().clientHeight;
		var y = charCoords.top;
		var lineHeight = charCoords.bottom - y;
		switch (position) {
			case 'center':
				y = y - (height / 2) + lineHeight;
				break;
			case 'bottom':
				y = y - height + lineHeight * 1.4;
				break;
			case 'top':
				y = y + lineHeight * 0.4;
				break;
		}
		cm.scrollTo(null, y);
	}

	function cursorLineToMiddle() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			scrollToCursor(editor, 'center');
		}
	}

	function cursorLineToTop() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			scrollToCursor(editor, 'top');
		}
	}

	function cursorLineToBottom() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			scrollToCursor(editor, 'bottom');
		}
	}

	function del() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// delete
			var selected = editor.getSelection();
			if (selected) {
				editor.replaceSelection('');
			} else {
				// get document current line info
				var pos = editor.getCursor(false);
				var info = editor.lineInfo(pos.line);

				// delete line
				if (info.text && info.text.length > 0) {
					editor.replaceRange('', {
						line : pos.line,
						ch : 0
					}, {
						line : pos.line,
						ch : info.text.length
					});
				} else {
					editor.replaceRange('', {
						line : pos.line,
						ch : 0
					}, {
						line : pos.line + 1,
						ch : 0
					});
				}
			}
		}
	}

	function selectAll() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// get document line info
			var lastLine = editor.lastLine();
			var lastLineCh = editor.lineInfo(lastLine).text.length;
			var from = {
				line : 0,
				ch : 0
			};
			var to = {
				line : lastLine,
				ch : lastLineCh
			};

			// select all
			editor.setSelection(from, to, {
				scroll : false
			});
		}
	}

	function selectLine() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// get document current line info
			var pos = editor.getCursor(false);
			var info = editor.lineInfo(pos.line);

			var from = {
				line : pos.line,
				ch : 0
			};
			var to = {
				line : pos.line,
				ch : info.text.length
			};

			// select line
			if (info.text && info.text.length > 0) {
				editor.extendSelection(from, to);
			}
		}
	}

	function lineIndent() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			var selected = editor.getSelection();
			if (selected) {
				// reselect
				var startPos = editor.getCursor(true);
				var endPos = editor.getCursor(false);

				// reselect
				var endPosInfo = editor.lineInfo(endPos.line);
				if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
					editor.setSelection({
						line : startPos.line,
						ch : 0
					}, {
						line : endPos.line,
						ch : endPosInfo.text.length
					});
				}

				// indent
				editor.indentSelection('add');
			} else {
				var pos = editor.getCursor();

				// indent
				editor.indentLine(pos.line, 'add');
			}
		}
	}

	function lineDedent() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			var selected = editor.getSelection();
			if (selected) {
				// reselect
				var startPos = editor.getCursor(true);
				var endPos = editor.getCursor(false);

				// reselect
				var endPosInfo = editor.lineInfo(endPos.line);
				if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
					editor.setSelection({
						line : startPos.line,
						ch : 0
					}, {
						line : endPos.line,
						ch : endPosInfo.text.length
					});
				}

				// unindent

				editor.indentSelection('subtract');

			} else {
				var pos = editor.getCursor();

				// unindent

				editor.indentLine(pos.line, 'subtract');
			}
		}

	}

	function lineMoveUp() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// line move up
			var moveUp = function(pos) {
				var srcLineNum = pos.line;
				var desLineNum = pos.line - 1;
				var srcLineText = editor.getLine(srcLineNum);
				var desLineText = editor.getLine(desLineNum);

				editor.replaceRange(desLineText, {
					line : srcLineNum,
					ch : 0
				}, {
					line : srcLineNum,
					ch : srcLineText.length
				}, '+input');
				editor.replaceRange(srcLineText, {
					line : desLineNum,
					ch : 0
				}, {
					line : desLineNum,
					ch : desLineText.length
				}, '+input');
				editor.setCursor({
					line : desLineNum,
					ch : pos.ch
				});
			};
			var selected = editor.getSelection();
			if (selected) {
				var startPos = editor.getCursor(true);
				var endPos = editor.getCursor(false);

				// reselect
				var endPosInfo = editor.lineInfo(endPos.line);
				if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
					editor.setSelection({
						line : startPos.line,
						ch : 0
					}, {
						line : endPos.line,
						ch : endPosInfo.text.length
					});
					startPos = editor.getCursor(true);
					endPos = editor.getCursor(false);
				}

				// move
				selected = editor.getSelection();
				var desLineNum = startPos.line - 1;
				var desLineText = editor.getLine(desLineNum);

				editor.replaceRange(desLineText, startPos, endPos, '+input');
				editor.replaceRange(selected, {
					line : desLineNum,
					ch : 0
				}, {
					line : desLineNum,
					ch : desLineText.length
				}, '+input');

				// reselect
				editor.setSelection({
					line : desLineNum,
					ch : 0
				}, {
					line : endPos.line - 1,
					ch : endPosInfo.text.length
				});
			} else {
				var pos = editor.getCursor();
				moveUp(pos);
			}
		}
	}

	function lineMoveDown() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// line move down
			var moveDown = function(pos) {
				var srcLineNum = pos.line;
				var desLineNum = pos.line + 1;
				var srcLineText = editor.getLine(srcLineNum);
				var desLineText = editor.getLine(desLineNum);

				editor.replaceRange(desLineText, {
					line : srcLineNum,
					ch : 0
				}, {
					line : srcLineNum,
					ch : srcLineText.length
				}, '+input');
				editor.replaceRange(srcLineText, {
					line : desLineNum,
					ch : 0
				}, {
					line : desLineNum,
					ch : desLineText.length
				}, '+input');
				editor.setCursor({
					line : desLineNum,
					ch : pos.ch
				});
			};
			var selected = editor.getSelection();
			if (selected) {
				var startPos = editor.getCursor(true);
				var endPos = editor.getCursor(false);

				// reselect
				var endPosInfo = editor.lineInfo(endPos.line);
				if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
					editor.setSelection({
						line : startPos.line,
						ch : 0
					}, {
						line : endPos.line,
						ch : endPosInfo.text.length
					});
					startPos = editor.getCursor(true);
					endPos = editor.getCursor(false);
				}

				// move
				selected = editor.getSelection();
				var desLineNum = endPos.line + 1;
				var desLineText = editor.getLine(desLineNum);

				editor.replaceRange(selected, {
					line : startPos.line + 1,
					ch : 0
				}, {
					line : desLineNum,
					ch : desLineText.length
				}, '+input');
				editor.replaceRange(desLineText, {
					line : startPos.line,
					ch : 0
				}, {
					line : startPos.line,
					ch : desLineText.length
				}, '+input');

				// reselect
				editor.setSelection({
					line : startPos.line + 1,
					ch : 0
				}, {
					line : desLineNum,
					ch : endPosInfo.text.length
				});

			} else {
				var pos = editor.getCursor();
				moveDown(pos);
			}
		}
	}

	function lineDelete() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// delete line
			var spos = editor.getCursor(true);
			var epos = editor.getCursor(false);
			var line = (spos.line <= epos.line ? spos.line : epos.line);
			var eposInfo = editor.lineInfo(epos.line);

			// selected line charactor delete
			if (spos.line !== epos.line) {
				editor.replaceRange('', {
					line : spos.line,
					ch : 0
				}, {
					line : epos.line,
					ch : eposInfo.text.length
				});
			}
			editor.replaceRange('', {
				line : line,
				ch : 0
			}, {
				line : line + 1,
				ch : 0
			});
			editor.setCursor({
				line : line,
				ch : 0
			});
		}
	}

	function lineComment() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// comment line
			editor.execCommand('linecomment');
		}
	}

	function blockComment() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// comment line
			editor.execCommand('blockcomment');
		}
	}

	function commentOutSelection() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// comment line
			editor.execCommand('commentOutSelection');
		}
	}

	function foldCode() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// fold
			if (editor.somethingSelected()) {
				editor.execCommand('foldselection');
			} else {
				var rf = editor.options.foldGutter.rangeFinder;
				editor.foldCode(editor.getCursor(), {
					scanUp : true,
					rangeFinder : rf
				});
			}
		}
	}

	function getBeautifier(editor, callback) {
		var currentModeName = editor.getMode().name;
		var beautifierModuleID;
		var beautifyOptions;
		/* jshint camelcase: false */
		if (currentModeName === 'javascript') {
			beautifierModuleID = 'external/js-beautify/js/lib/beautify';
			// TODO .editorconfig-aware options
			beautifyOptions = {
				jslint_happy : true,
				wrap_line_length : 120
			};
			require([beautifierModuleID], function(beautifier) {
				callback(beautifier.js_beautify, beautifyOptions);
			});
		} else if (currentModeName === 'htmlmixed') {
			beautifierModuleID = 'external/js-beautify/js/lib/beautify-html';
			require([beautifierModuleID], function(beautifier) {
				callback(beautifier.html_beautify, beautifyOptions);
			});
		} else if (currentModeName === 'css') {
			beautifierModuleID = 'external/js-beautify/js/lib/beautify-css';
			require([beautifierModuleID], function(beautifier) {
				callback(beautifier.css_beautify, beautifyOptions);
			});
		} else {
			// Shouldn't be reached
			callback();
		}
		/* jshint camelcase: true */
	}

	function beautifyCode() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			getBeautifier(editor, function(beautifier, options) {
				if (beautifier) {
					// reselect
					var startPos = editor.getCursor('from'), startPosOrig;
					var endPos = editor.getCursor('to');
					var endPosInfo = editor.lineInfo(endPos.line);

					if (startPos.ch !== 0) {
						startPosOrig = startPos;
						startPos = {
							line : startPos.line,
							ch : 0
						};
					}
					if (endPosInfo.text.length !== endPos.ch) {
						endPos = {
							line : endPos.line,
							ch : endPosInfo.text.length
						};
					}

					editor.replaceRange(beautifier(editor.getRange(startPos, endPos), options), startPos, endPos);
				}
			});
		}
	}

	var ANCHOR_STR = '_line_of_original_cursor_';
	function beautifyAllCode() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			getBeautifier(editor, function(beautifier, options) {
				if (beautifier) {
					var cursor = editor.getCursor();
					var mode = editor.getModeAt(cursor);

					editor.operation(function() {
						if (mode.blockCommentStart) {
							var anchorComment = mode.blockCommentStart + ANCHOR_STR + mode.blockCommentEnd;
							editor.replaceRange(anchorComment + '\n', {
								line : cursor.line,
								ch : 0
							}, {
								line : cursor.line,
								ch : 0
							}, '+beautifyAll');
						}

						var startPos = {
							line : editor.firstLine(),
							ch : 0
						};
						var lastLine, endPos = {
							line : ( lastLine = editor.lastLine()),
							ch : editor.getLine(lastLine).length
						};
						editor.replaceRange(beautifier(editor.getValue(), options), startPos, endPos, '+beautifyAll');

						if (mode.blockCommentStart) {
							var i, j = -1;
							for ( i = 0; i < editor.lineCount(); i++) {
								var line = editor.getLine(i);
								if (( j = line.indexOf(ANCHOR_STR)) >= 0) {
									break;
								}
							}
							if (j >= 0) {
								var token = editor.getTokenAt({
									line : i,
									ch : j
								}, true);
								if (token.string.indexOf(mode.blockCommentEnd) > 0) {
									editor.setCursor({
										line : i,
										ch : 0
									});
									editor.replaceRange('', {
										line : i,
										ch : 0
									}, {
										line : i + 1,
										ch : 0
									}, '+beautifyAll');
								}
							}
						}
					});
				}
			});
		}
	}

	function rename() {
		if (editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor) {
			// currentFile focus
			var editor = editors.currentFile.editorContext.editor;
			editor.focus();

			// rename trigger
			editor.execCommand('tern-rename');
		}
	}

	function switchEditorTabToExSelected() {
		var exFile = editors.currentFiles[1];
		if (exFile) {
			var view = vm.getView(exFile.viewId);
			if (view) {
				view.select(true);
			} else {
				console.warn('unexpected');
			}
		}
	}

	function goPrevTab() {
		var focusedViewContainer = editors.splitViewContainer.getFocusedViewContainer();
		if (focusedViewContainer) {
			var view = focusedViewContainer.getSelectedView();
			var viewCount = focusedViewContainer.getNumOfViews();
			if (view && (viewCount > 1)) {
				var newIndex = focusedViewContainer.getViewIndex(view) - 1;
				if (newIndex < 0) {
					newIndex = viewCount - 1;
				}
				var targetView = focusedViewContainer.getViewByIndex(newIndex);
				if (targetView) {
					targetView.select(true);
				}
			}
		}
	}

	function goNextTab() {
		var focusedViewContainer = editors.splitViewContainer.getFocusedViewContainer();
		if (focusedViewContainer) {
			var view = focusedViewContainer.getSelectedView();
			var viewCount = focusedViewContainer.getNumOfViews();
			if (view && (viewCount > 1)) {
				var newIndex = focusedViewContainer.getViewIndex(view) + 1;
				if (newIndex >= viewCount) {
					newIndex = 0;
				}
				var targetView = focusedViewContainer.getViewByIndex(newIndex);
				if (targetView) {
					targetView.select(true);
				}
			}
		}
	}

	function switchEditorTab() {
		var fieldLayout = [{
			'name' : 'Name',
			'field' : 'title',
			'width' : '200'
		}, {
			'name' : 'Path',
			'field' : 'path',
			'width' : '500'
		}];
		editors.editorTabFocusController.showViewList(fieldLayout, 'Select Editor Tab from List');
	}

	function focusMoveToNextTabContainer() {
		var sp = editors.splitViewContainer;
		var focusedVc = sp.getFocusedViewContainer();
		var nextVc = null;
		//TODO FIXME
		if (focusedVc) {
			var showedVcList = sp.getShowedViewContainers();
			if (showedVcList.length > 1) {
				for (var i = 0; i < showedVcList.length; i++) {
					if (showedVcList[i] === focusedVc) {
						if (i >= showedVcList.length - 1) {
							nextVc = showedVcList[0];
						} else {
							nextVc = showedVcList[i + 1];
						}
						if (nextVc.getSelectedView()) {
							nextVc.getSelectedView().select(true);
						}
					}
				}

			}
		}
	}

	function moveToOtherTabContainer() {
		var spContainer = editors.splitViewContainer;
		var vc = spContainer.getFocusedViewContainer();
		var view = vc.getSelectedView();
		if (vc && view) {
			var viewContainers = spContainer.getViewContainers();
			var i = viewContainers.indexOf(vc);
			console.assert(i >= 0);
			var targetView = (i < viewContainers.length - 1 ? viewContainers[i + 1] : viewContainers[0]);
			var views = vc.getViewList();
			if (views.length === 1) {
				spContainer.moveView(targetView, view);
				view.select(true);
			} else {
				var j = views.indexOf(view);
				var nextSelectedView = (j > 0 ? views[j - 1] : views[1]);
				var nextSelectedFile = editors.getFileByViewId(nextSelectedView.getId());
				editors.ensureCreated(nextSelectedFile, false, function() {
					spContainer.moveView(targetView, view);
					view.select(true);
				});
			}
		}
	}

	function rotateToVertical() {
		var showedVc = editors.splitViewContainer.getShowedViewContainers();
		if (showedVc && (showedVc.length === 1)) {
			//editors.moveToNextTabContainer();
			moveToOtherTabContainer();
		}
		editors.splitViewContainer.set('verticalSplit', true);
	}

	function rotateToHorizontal() {
		var showedVc = editors.splitViewContainer.getShowedViewContainers();
		if (showedVc && (showedVc.length === 1)) {
			//editors.moveToNextTabContainer();
			moveToOtherTabContainer();
		}
		editors.splitViewContainer.set('verticalSplit', false);
	}

	function saveAllFiles() {
		// editors.files is currently opened file list
		var opened = _.values(editors.files);
		var currentFile = editors.currentFile;

		_.each(opened, function(file) {
			if (file.isModified()) {
				editors.setCurrentFile(file);
				editors.saveFile();
			}
		});
		editors.setCurrentFile(currentFile);
	}

	function closeOtherFiles() {
		var curFilePath = editors.currentFile.path;

		// editors.files is currently opened file list
		var opened = _.values(editors.files);

		_.each(opened, function(file) {
			if (file.path !== curFilePath) {
				editors.closeFile({
					path : file.path
				});
			}
		});
	}

	function closeAllFiles() {
		// editors.files is currently opened file list
		var opened = _.values(editors.files);

		_.each(opened, function(file) {
			editors.closeFile({
				path : file.path
			});
		});
	}

	function replace() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('replace');
		});
	}

	function find() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('find');
		});
	}

	function quickFind() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('highlightSearch');
		});
	}

	function findNext() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('findNext');
		});
	}

	function findPrev() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('findPrev');
		});
	}

	function gotoDefinition() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('tern-gotodefinition');
		});
	}

	function gotoLine() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			editor.execCommand('gotoLine');
		});
	}

	function gotoMatchingBrace() {
		editors.doWithCurrentEditor(function(instance, editor) {
			editor.focus();
			var pos = editor.getCursor();
			var mb = editor.findMatchingBracket(pos, false);
			if (mb && mb.match) {
				if (pos.line === mb.from.line) {
					// goto to
					editor.setCursor(mb.to);
				} else if (pos.line === mb.to.line) {
					// goto from
					editor.setCursor(mb.from);
				}
			}
		});
	}

	function openRecentFile(index) {
		var path = editors.recentFiles[index];
		editors.openFile(path);
	}

	return {
		undo : undo,
		redo : redo,
		del : del,
		selectAll : selectAll,
		selectLine : selectLine,
		cursorLineToMiddle : cursorLineToMiddle,
		cursorLineToTop : cursorLineToTop,
		cursorLineToBottom : cursorLineToBottom,
		lineIndent : lineIndent,
		lineDedent : lineDedent,
		lineMoveUp : lineMoveUp,
		lineMoveDown : lineMoveDown,
		lineDelete : lineDelete,
		lineComment : lineComment,
		blockComment : blockComment,
		commentOutSelection : commentOutSelection,
		foldCode : foldCode,
		beautifyCode : beautifyCode,
		beautifyAllCode : beautifyAllCode,
		rename : rename,
		switchEditorTabToExSelected : switchEditorTabToExSelected,
		goPrevTab : goPrevTab,
		goNextTab : goNextTab,
		switchEditorTab : switchEditorTab,
		focusMoveToNextTabContainer : focusMoveToNextTabContainer,
		moveToOtherTabContainer : moveToOtherTabContainer,
		rotateToVertical : rotateToVertical,
		rotateToHorizontal : rotateToHorizontal,
		saveAllFiles : saveAllFiles,
		closeOtherFiles : closeOtherFiles,
		closeAllFiles : closeAllFiles,
		replace : replace,
		find : find,
		quickFind : quickFind,
		findNext : findNext,
		findPrev : findPrev,
		gotoDefinition : gotoDefinition,
		gotoLine : gotoLine,
		gotoMatchingBrace : gotoMatchingBrace,
		openRecentFile : openRecentFile
	};

});
