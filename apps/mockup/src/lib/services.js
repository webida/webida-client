var Services = Services || {};

(function() {
	'use strict';
	var DOMAIN = 'http://172.21.110.84:8080/'

	Services.MsgFmt = {};	
	var MsgFmt = Services.MsgFmt;
	MsgFmt.lists = function (options, callback) {
		var url = DOMAIN + 'ocp/messagefmt';

		$.ajax({
			method: 'GET',
			url: url,
			data: { page: options.page, limit: options.limit },
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

	MsgFmt.deleteThing = function (messageCode, callback) {
		var url = DOMAIN + 'ocp/messagefmt/'+ messageCode;

		$.ajax({
			method: 'DELETE',
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

	MsgFmt.details = function (messageCode, callback) {
		var url = DOMAIN + 'ocp/messagefmt/' + messageCode;

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

	MsgFmt.registerThing = function (data, callback)  {
		var url = DOMAIN + 'ocp/messagefmt/';

		$.ajax({
			method: 'POST',
			url: url,
			data: {
				messageName: data.messageName || '',
				formatVersion: data.formatVersion || '',
				thingModel: data.thingModel || '',
				description: data.description || '',
				formatType: data.formatType || 'json',
				format: data.format || ''
			},
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

	MsgFmt.updateThing = function (messageCode, options, callback)  {
		var url = DOMAIN + 'ocp/messagefmt/' + messageCode;

		$.ajax({
			method: 'PUT',
			url: url,
			data: {				
				messageName: options.messageName || '',
				formatVersion: options.formatVersion || '',
				thingModel: options.thingModel || '',
				description: options.description || '',
				formatType: options.formatType || '',
				format: options.format || ''
			},
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