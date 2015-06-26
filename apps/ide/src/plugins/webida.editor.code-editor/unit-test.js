/* global QUnit */
require(['codeEditors/webida.editor.code-editor/CodeEditorPart'], function (CodeEditorPart) {
    'use strict';
    var part = new CodeEditorPart();
    QUnit.test('TestEditor API Validation', function (assert) {
        assert.ok(typeof part.create === 'function', 'create() method exists');
		assert.ok(typeof part.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof part.show === 'function', 'show() method exists');
		assert.ok(typeof part.hide === 'function', 'hide() method exists');
		assert.ok(typeof part.focus === 'function', 'focus() method exists');
		assert.ok(typeof part.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof part.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof part.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof part.isClean === 'function', 'isClean() method exists');
    });
});