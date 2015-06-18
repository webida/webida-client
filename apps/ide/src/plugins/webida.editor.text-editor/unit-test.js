/* global QUnit */
require(['TextEditors/webida.editor.text-editor/TextEditor'], function (TextEditor) {
    'use strict';
    QUnit.test('TextEditor API Validation', function (assert) {
        assert.ok(typeof TextEditor.create === 'function', 'create() method exists');
		assert.ok(typeof TextEditor.show === 'function', 'show() method exists');
		assert.ok(typeof TextEditor.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof TextEditor.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof TextEditor.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof TextEditor.focus === 'function', 'focus() method exists');
		assert.ok(typeof TextEditor.moveBack === 'function', 'moveBack() method exists');
		assert.ok(typeof TextEditor.moveForth === 'function', 'moveForth() method exists');
		assert.ok(typeof TextEditor.getLastSavedFoldingStatus === 'function', 'getLastSavedFoldingStatus() method exists');
		assert.ok(typeof TextEditor.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof TextEditor.isClean === 'function', 'isClean() method exists');
		assert.ok(typeof TextEditor.setMode === 'function', 'setMode() method exists');
    });
});