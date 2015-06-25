/* global QUnit */
require(['testEditors/webida.editor.test-editor/TestEditor'], function (TestEditor) {
    'use strict';
    var testEditor = new TestEditor();
    QUnit.test('TestEditor API Validation', function (assert) {
        assert.ok(typeof testEditor.create === 'function', 'create() method exists');
		assert.ok(typeof testEditor.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof testEditor.show === 'function', 'show() method exists');
		assert.ok(typeof testEditor.hide === 'function', 'hide() method exists');
		assert.ok(typeof testEditor.focus === 'function', 'focus() method exists');
		assert.ok(typeof testEditor.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof testEditor.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof testEditor.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof testEditor.isClean === 'function', 'isClean() method exists');
    });
});