var MessageService = {};

(function() {
	'use strict';
	var DOMAIN = 'http://172.21.110.84:8080/'

	MessageService.lists = function (options, callback) {
		var url = DOMAIN + 'ocp/msgFormat';

		$.ajax({
			method: 'GET',
			url: url,
			data: { page: options.page, limit: options.limit },
			crossDomain: true,
			dataType: 'jsonp',
			success: function (data) {
				callback(null, data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				callback(status, {
					jqXHR: jqXHR,
					textStatus, textStatus,
					errorThrown: errorThrown
				});
			}
		});
	};

	MessageService.test = function (callback) {
		var url = '../test/model.json';

		$.ajax({
			method: 'GET',
			url: url,
			success: function (data) {
				callback(null, data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				callback(status, {
					jqXHR: jqXHR,
					textStatus, textStatus,
					errorThrown: errorThrown
				});
			}
		});
	};

	MessageService.details = function (messageCode, callback) {
		var url = DOMAIN + 'ocp/msgFormat/' + messageCode;

		$.ajax({
			method: 'GET',
			url: url,
			success: function (data) {
				callback(null, data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				callback(status, {
					jqXHR: jqXHR,
					textStatus, textStatus,
					errorThrown: errorThrown
				});
			}
		});
	};
})();