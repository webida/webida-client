define([
    'external/toastr/toastr.min'
], function (
    Toastr
) {
    'use strict';
    var notificationClassPrefix = 'notification-message-';
    var colors = {};

    function setPreferenceColor(values) {
        for (var key in values) {
            if (values.hasOwnProperty(key) && key.endsWith('-color')) {
                var type = key.substring(0, key.indexOf('-color'));
                colors[type] = values[key];
                $('#log').find('.' + notificationClassPrefix + type).css({color: colors[type]});
            }
        }
    }

    function setNotification(type, message, title/*, optionsOverride*/) {
        var messageString = '[' + new Date().toLocaleString() + ']';
        if (title) {
            messageString += ' [' + title + ']';
        }
        if (message) {
            messageString += message;
        }
        var $message = $('<p class="notification-message"></p>')
            .addClass(notificationClassPrefix + type)
            .css({color: colors[type]})
            .text(messageString);
        $('#log').append($message);
    }

    function getContainer(options, create) {
        Toastr.getContainer(options, create);
    }

    function subscribe(callback) {
        Toastr.subscribe(callback);
    }

    function clear($toastElement, clearOptions) {
        Toastr.clear($toastElement, clearOptions);
    }

    function remove($toastElement) {
        Toastr.remove($toastElement);
    }

    function error(message, title, optionsOverride) {
        setNotification('error', message, title, optionsOverride);
        Toastr.error(message, title, optionsOverride);
    }

    function warning(message, title, optionsOverride) {
        setNotification('warn', message, title, optionsOverride);
        Toastr.warning(message, title, optionsOverride);
    }

    function info(message, title, optionsOverride) {
        setNotification('info', message, title, optionsOverride);
        Toastr.info(message, title, optionsOverride);
    }

    function success(message, title, optionsOverride) {
        setNotification('success', message, title, optionsOverride);
        Toastr.success(message, title, optionsOverride);
    }

    return {
        getContainer: getContainer,
        subscribe: subscribe,
        clear: clear,
        remove: remove,
        error: error,
        warning: warning,
        info: info,
        success: success,
        setPreferenceColor: setPreferenceColor
    };
});

