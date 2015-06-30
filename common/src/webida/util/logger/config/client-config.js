/**
 * Global Config
 */
'use strict';
define(function(/*require, exports, module*/) {
	var LEVELS = {
		off : 0,
		log : 1,
		info : 2,
		warn : 4,
		error : 8,
		trace : 16,
		all : 31
	};
    /*jslint bitwise: true */
	return {
		level : LEVELS.all
	};
    /*jslint bitwise: false */
});
