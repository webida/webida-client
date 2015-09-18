/* global QUnit */
require(['plugins/webida.editor.test-editor/TestEditorPart'], function (TestEditorPart) {
    'use strict';
    var testEditor = new TestEditorPart();
    QUnit.test('TestEditor API Validation', function (assert) {
        assert.ok(typeof testEditor.create === 'function', 'create() method exists');
		assert.ok(typeof testEditor.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof testEditor.show === 'function', 'show() method exists');
		assert.ok(typeof testEditor.hide === 'function', 'hide() method exists');
		assert.ok(typeof testEditor.focus === 'function', 'focus() method exists');
		assert.ok(typeof testEditor.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof testEditor.addChangeListener === 'function', 'addChangeListener() method exists');
    });
});