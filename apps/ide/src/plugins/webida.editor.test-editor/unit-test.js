/* global QUnit */
require(['plugins/webida.editor.test-editor/plugin'], function (plugin) {
    'use strict';
    QUnit.test('TestEditor API Test', function (assert) {
        assert.ok(typeof plugin.create === 'function', 'create method exists');
    });
});