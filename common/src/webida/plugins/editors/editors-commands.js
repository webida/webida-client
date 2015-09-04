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
	'webida-lib/util/logger/logger-client', 
	'dojo/topic', 
	'external/lodash/lodash.min'
], function (
	editors, 
	workbench, 
	vm, 
	Logger,
	topic, 
	_
) {
    'use strict';

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

	function undo() {		
        editors.execCommandForCurrentEditorViewer('undo');
	}

	function redo() {		
        editors.execCommandForCurrentEditorViewer('redo');
	}

	function cursorLineToMiddle() {		
        editors.execCommandForCurrentEditorViewer('cursorLineToMiddle');
	}

	function cursorLineToTop() {		
        editors.execCommandForCurrentEditorViewer('cursorLineToTop');
	}

	function cursorLineToBottom() {		
        editors.execCommandForCurrentEditorViewer('cursorLineToBottom');
	}

	function del() {		
        editors.execCommandForCurrentEditorViewer('del');
	}

	function selectAll() {		
        editors.execCommandForCurrentEditorViewer('selectAll');
	}

	function selectLine() {		
        editors.execCommandForCurrentEditorViewer('selectLine');
	}

	function lineIndent() {		
        editors.execCommandForCurrentEditorViewer('lineIndent');
	}

	function lineDedent() {		
        editors.execCommandForCurrentEditorViewer('lineDedent');
	}

	function lineMoveUp() {		
        editors.execCommandForCurrentEditorViewer('lineMoveUp');
	}

	function lineMoveDown() {		
        editors.execCommandForCurrentEditorViewer('lineMoveDown');
	}

	function lineDelete() {		
        editors.execCommandForCurrentEditorViewer('lineDelete');
	}

	function lineComment() {		
        editors.execCommandForCurrentEditorViewer('lineComment');
	}

	function blockComment() {		
        editors.execCommandForCurrentEditorViewer('blockComment');
	}

	function commentOutSelection() {		
        editors.execCommandForCurrentEditorViewer('commentOutSelection');
	}

	function foldCode() {		
        editors.execCommandForCurrentEditorViewer('foldCode');
	}

	function beautifyCode() {		
        editors.execCommandForCurrentEditorViewer('beautifyCode');
	}

	function beautifyAllCode() {		
        editors.execCommandForCurrentEditorViewer('beautifyAllCode');
	}

	function rename() {		
        editors.execCommandForCurrentEditorViewer('rename');
	}
    
    function replace() {        
        editors.execCommandForCurrentEditorViewer('replace');
    }

    function find() {        
        editors.execCommandForCurrentEditorViewer('find');
    }

    function quickFind() {        
        editors.execCommandForCurrentEditorViewer('quickFind');
    }

    function findNext() {        
        editors.execCommandForCurrentEditorViewer('findNext');
    }

    function findPrev() {        
        editors.execCommandForCurrentEditorViewer('findPrev');
    }

    function gotoDefinition() {        
        editors.execCommandForCurrentEditorViewer('gotoDefinition');
    }

    function gotoLine() {        
        editors.execCommandForCurrentEditorViewer('gotoLine');
    }

    function gotoMatchingBrace() {        
        editors.execCommandForCurrentEditorViewer('gotoMatchingBrace');
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

	function saveFile() {
		topic.publish('#REQUEST.saveFile');
	}

	function saveAllFiles() {
        var page = workbench.getCurrentPage();
        var registry = page.getPartRegistry();
        var parts = registry.getDirtyParts();
        parts.forEach(function(part){
        	part.save();
        });
	}

	function closeOtherFiles() {
		var curFilePath = editors.currentFile.path;
		var opened = _.values(editors.files);
		_.each(opened, function (file) {
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

		_.each(opened, function (file) {
			editors.closeFile({
				path : file.path
			});
		});
	}	

	function openRecentFile(index) {
		var path = editors.recentFiles[index];
		topic.publish('#REQUEST.openFile', path);
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
		saveFile : saveFile,
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
