/* global QUnit */
require(['codeEditors/webida.editor.code-editor/CodeEditor'], function (CodeEditor) {
    'use strict';
    var codeEditor = new CodeEditor();
    QUnit.test('TestEditor API Validation', function (assert) {
        assert.ok(typeof codeEditor.create === 'function', 'create() method exists');
		assert.ok(typeof codeEditor.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof codeEditor.show === 'function', 'show() method exists');
		assert.ok(typeof codeEditor.hide === 'function', 'hide() method exists');
		assert.ok(typeof codeEditor.focus === 'function', 'focus() method exists');
		assert.ok(typeof codeEditor.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof codeEditor.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof codeEditor.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof codeEditor.isClean === 'function', 'isClean() method exists');
    });
});