/* global QUnit */
require(['editors/webida.editor.text-editor/TextEditor'], function (TextEditor) {
    'use strict';
    var editor = new TextEditor();
    QUnit.test('editor API Validation', function (assert) {
        assert.ok(typeof editor.create === 'function', 'create() method exists');
        assert.ok(typeof editor.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof editor.show === 'function', 'show() method exists');
		assert.ok(typeof editor.hide === 'function', 'hide() method exists');
		assert.ok(typeof editor.focus === 'function', 'focus() method exists');
		assert.ok(typeof editor.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof editor.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof editor.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof editor.isClean === 'function', 'isClean() method exists');
    });
});