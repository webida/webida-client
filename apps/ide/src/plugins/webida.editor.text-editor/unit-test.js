/* global QUnit */
require(['codeEditors/webida.editor.text-editor/CodeEditor'], function (CodeEditor) {
    'use strict';
    var codeEditor = new CodeEditor();
    QUnit.test('codeEditor API Validation', function (assert) {
        assert.ok(typeof codeEditor.create === 'function', 'create() method exists');
		assert.ok(typeof codeEditor.show === 'function', 'show() method exists');
		assert.ok(typeof codeEditor.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof codeEditor.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof codeEditor.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof codeEditor.focus === 'function', 'focus() method exists');
		assert.ok(typeof codeEditor.moveBack === 'function', 'moveBack() method exists');
		assert.ok(typeof codeEditor.moveForth === 'function', 'moveForth() method exists');
		assert.ok(typeof codeEditor.getLastSavedFoldingStatus === 'function', 'getLastSavedFoldingStatus() method exists');
		assert.ok(typeof codeEditor.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof codeEditor.isClean === 'function', 'isClean() method exists');
		assert.ok(typeof codeEditor.setMode === 'function', 'setMode() method exists');
    });
});