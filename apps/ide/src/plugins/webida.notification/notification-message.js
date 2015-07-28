define([
    'external/toastr/toastr.min'
], function (
    Toastr
) {
    'use strict';

    var notification = { log : ''};

    function setNotification(message, title, optionsOverride) {
        var d = new Date();
        notification.log += '[' + d.toString() + '] ' + '[' + title + '] ' + (message ? message : '') + '<br>';
        $('#log').html(notification.log);
    }

    function error(message, title, optionsOverride) {
        setNotification(message, title, optionsOverride);
        Toastr.error(message, title, optionsOverride);
    }

    function getContainer(options, create) {
        Toastr.getContainer(options, create);
    }

    function info(message, title, optionsOverride) {
        setNotification(message, title, optionsOverride);
        Toastr.info(message, title, optionsOverride);
    }

    function subscribe(callback) {
        Toastr.subscribe(callback);
    }

    function success(message, title, optionsOverride) {
        setNotification(message, title, optionsOverride);
        Toastr.success(message, title, optionsOverride);
    }

    function warning(message, title, optionsOverride) {
        setNotification(message, title, optionsOverride);
        Toastr.warning(message, title, optionsOverride);
    }

    function clear($toastElement, clearOptions) {
        Toastr.clear($toastElement, clearOptions);
    }

    function remove($toastElement) {
        Toastr.remove($toastElement);
    }

    return {
        error : error,
        getContainer : getContainer,
        info : info,
        subscribe : subscribe,
        success : success,
        warning : warning,
        clear : clear,
        remove : remove
    };
});

