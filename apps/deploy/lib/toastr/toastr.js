/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(function () {
    return (function () {
        var version = '2.0.0';
        var $container;
        var listener;
        var toastId = 0;
        var toastType = {
            error: 'error',
            info: 'info',
            success: 'success',
            warning: 'warning'
        };
        
        var toastr = {
            clear: clear,
            error: error,
            getContainer: getContainer,
            info: info,
            options: {},
            subscribe: subscribe,
            success: success,
            version: version,
            warning: warning
        };
        
        return toastr;
        
        //#region Accessible Methods
        function error(message, title, optionsOverride) {
            return notify({
                type: toastType.error,
                iconClass: getOptions().iconClasses.error,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }
        
        function info(message, title, optionsOverride) {
            return notify({
                type: toastType.info,
                iconClass: getOptions().iconClasses.info,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }
        
        function subscribe(callback) {
            listener = callback;
        }
        
        function success(message, title, optionsOverride) {
            return notify({
                type: toastType.success,
                iconClass: getOptions().iconClasses.success,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }
        
        function warning(message, title, optionsOverride) {
            return notify({
                type: toastType.warning,
                iconClass: getOptions().iconClasses.warning,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }
        
        function clear($toastElement) {
            var options = getOptions();
            if (!$container) { getContainer(options); }
            if ($toastElement && $(':focus', $toastElement).length === 0) {
                $toastElement[options.hideMethod]({
                    duration: options.hideDuration,
                    easing: options.hideEasing,
                    complete: function () { removeToast($toastElement); }
                });
                return;
            }
            if ($container.children().length) {
                $container[options.hideMethod]({
                    duration: options.hideDuration,
                    easing: options.hideEasing,
                    complete: function () { $container.remove(); }
                });
            }
        }
        //#endregion
        
        //#region Internal Methods
        
        function getDefaults() {
            return {
                tapToDismiss: true,
                toastClass: 'toast',
                containerId: 'toast-container',
                debug: false,
                
                showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
                showDuration: 300,
                showEasing: 'swing', //swing and linear are built into jQuery
                onShown: undefined,
                hideMethod: 'fadeOut',
                hideDuration: 1000,
                hideEasing: 'swing',
                onHidden: undefined,
                
                extendedTimeOut: 1000,
                iconClasses: {
                    error: 'toast-error',
                    info: 'toast-info',
                    success: 'toast-success',
                    warning: 'toast-warning'
                },
                iconClass: 'toast-info',
                positionClass: 'toast-top-right',
                timeOut: 5000, // Set timeOut and extendedTimeout to 0 to make it sticky
                titleClass: 'toast-title',
                messageClass: 'toast-message',
                target: 'body',
                closeHtml: '<button>&times;</button>',
                newestOnTop: true
            };
        }
        
        function publish(args) {
            if (!listener) {
                return;
            }
            listener(args);
        }
        
        function notify(map) {
            var
            options = getOptions(),
                iconClass = map.iconClass || options.iconClass;
            
            if (typeof (map.optionsOverride) !== 'undefined') {
                options = $.extend(options, map.optionsOverride);
                iconClass = map.optionsOverride.iconClass || iconClass;
            }
            
            toastId++;
            
            $container = getContainer(options);
            var
            intervalId = null,
                $toastElement = $('<div/>'),
                $titleElement = $('<div/>'),
                $messageElement = $('<div/>'),
                $closeElement = $(options.closeHtml),
                response = {
                    toastId: toastId,
                    state: 'visible',
                    startTime: new Date(),
                    options: options,
                    map: map
                };
            
            if (map.iconClass) {
                $toastElement.addClass(options.toastClass).addClass(iconClass);
            }
            
            if (map.title) {
                $titleElement.append(map.title).addClass(options.titleClass);
                $toastElement.append($titleElement);
            }
            
            if (map.message) {
                $messageElement.append(map.message).addClass(options.messageClass);
                $toastElement.append($messageElement);
            }
            
            if (options.closeButton) {
                $closeElement.addClass('toast-close-button');
                $toastElement.prepend($closeElement);
            }
            
            $toastElement.hide();
            if (options.newestOnTop) {
                $container.prepend($toastElement);
            } else {
                $container.append($toastElement);
            }
            
            
            $toastElement[options.showMethod](
                { duration: options.showDuration, easing: options.showEasing, complete: options.onShown }
            );
            if (options.timeOut > 0) {
                intervalId = setTimeout(hideToast, options.timeOut);
            }
            
            $toastElement.hover(stickAround, delayedhideToast);
            if (!options.onclick && options.tapToDismiss) {
                $toastElement.click(hideToast);
            }
            if (options.closeButton && $closeElement) {
                $closeElement.click(function (event) {
                    event.stopPropagation();
                    hideToast(true);
                });
            }
            
            if (options.onclick) {
                $toastElement.click(function () {
                    options.onclick();
                    hideToast();
                });
            }
            
            publish(response);
            
            if (options.debug && console) {
                console.log(response);
            }
            
            return $toastElement;
            
            function hideToast(override) {
                if ($(':focus', $toastElement).length && !override) {
                    return;
                }
                return $toastElement[options.hideMethod]({
                    duration: options.hideDuration,
                    easing: options.hideEasing,
                    complete: function () {
                        removeToast($toastElement);
                        if (options.onHidden) {
                            options.onHidden();
                        }
                        response.state = 'hidden';
                        response.endTime = new Date(),
                            publish(response);
                    }
                });
            }
            
            function delayedhideToast() {
                if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                    intervalId = setTimeout(hideToast, options.extendedTimeOut);
                }
            }
            
            function stickAround() {
                clearTimeout(intervalId);
                $toastElement.stop(true, true)[options.showMethod](
                    { duration: options.showDuration, easing: options.showEasing }
                );
            }
        }
        function getContainer(options) {
            if (!options) { options = getOptions(); }
            $container = $('#' + options.containerId);
            if ($container.length) {
                return $container;
            }
            $container = $('<div/>')
            .attr('id', options.containerId)
            .addClass(options.positionClass);
            $container.appendTo($(options.target));
            return $container;
        }
        
        function getOptions() {
            return $.extend({}, getDefaults(), toastr.options);
        }
        
        function removeToast($toastElement) {
            if (!$container) { $container = getContainer(); }
            if ($toastElement.is(':visible')) {
                return;
            }
            $toastElement.remove();
            $toastElement = null;
            if ($container.children().length === 0) {
                $container.remove();
            }
        }
        //#endregion
        
    })();
});
