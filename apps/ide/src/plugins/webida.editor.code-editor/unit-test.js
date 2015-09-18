/* global QUnit */
require(['plugins/webida.editor.code-editor/CodeEditorPart'], function (CodeEditorPart) {
    'use strict';
    var part = new CodeEditorPart();
    QUnit.test('TestEditor API Validation', function (assert) {
        assert.ok(typeof part.create === 'function', 'create() method exists');
		assert.ok(typeof part.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof part.show === 'function', 'show() method exists');
		assert.ok(typeof part.hide === 'function', 'hide() method exists');
		assert.ok(typeof part.focus === 'function', 'focus() method exists');
    });
});