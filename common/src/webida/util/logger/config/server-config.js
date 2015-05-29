/**
 * Global Config
 */

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
module.exports = {
	level : LEVELS.all | LEVELS.info,
	logDir : './logs/'
};
/*jslint bitwise: false */