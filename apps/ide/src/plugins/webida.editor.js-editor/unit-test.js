/* global QUnit */
require(['plugins/webida.editor.js-editor/plugin'], function (plugin) {
    'use strict';
    QUnit.test('JsEditor API Validation', function (assert) {
        assert.ok(typeof plugin.create === 'function', 'create() method exists');
		assert.ok(typeof plugin.show === 'function', 'show() method exists');
		assert.ok(typeof plugin.destroy === 'function', 'destroy() method exists');
		assert.ok(typeof plugin.getValue === 'function', 'getValue() method exists');
		assert.ok(typeof plugin.addChangeListener === 'function', 'addChangeListener() method exists');
		assert.ok(typeof plugin.focus === 'function', 'focus() method exists');
		assert.ok(typeof plugin.pushCursorLocation === 'function', 'pushCursorLocation() method exists');
		assert.ok(typeof plugin.moveBack === 'function', 'moveBack() method exists');
		assert.ok(typeof plugin.moveForth === 'function', 'moveForth() method exists');
		assert.ok(typeof plugin.moveTo === 'function', 'moveTo() method exists');
		assert.ok(typeof plugin.getLastSavedFoldingStatus === 'function', 'getLastSavedFoldingStatus() method exists');
		assert.ok(typeof plugin.markClean === 'function', 'markClean() method exists');
		assert.ok(typeof plugin.isClean === 'function', 'isClean() method exists');
		assert.ok(typeof plugin.setMode === 'function', 'setMode() method exists');
    });
});