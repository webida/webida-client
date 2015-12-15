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

/**
 * @file Capture screenshot
 * @since 1.0.0
 * @author cimfalab@gmail.com
 */

define(['dojo/Deferred',
        'lib/test/html2canvas.wrapper'
       ],
function (Deferred, html2canvas) {
    'use strict';

    // constructor
    var Capture = function () {
    };

    Capture.NONE_SELECTED = 'None selected';

    Capture.prototype.capture = function (target, options) {
        var deferred = new Deferred();

        var $frames = $(target);
        var head = '', divs = '', pageWidth = 0, pageHeight = 0, count = $frames.length;
        if (count === 0) { // None selected
            return deferred.reject(new Error(Capture.NONE_SELECTED));
        }
        head = '<style>body { background: white; } ' +
            '.wrapper { background: white; margin: 32px; } ' +
            '.frame { background: white; float: left; border: 1px solid #cccccc; margin: 10px; }</style>';
        $frames.each(function (index, value) {
            var $frame = $(value);
            var h2 = $frame.find('h2').get(0);
            var $iframe = $frame.find('iframe');
            // Is there a need to render h2 element to image?
            _captureFrame($iframe.get(0), $.extend(options, { height: $iframe.height() }))
                .then(function (data) {
                    divs += '<div class="frame"><h2>' + h2.innerHTML + '</h2><img src="' + data + '" /></div>';
                    pageWidth += $iframe.outerWidth(true);
                    if (!--count) {
                        var $iframeRender = $('<iframe border=0 frameborder=0>');
                        $iframeRender.width('100%').height(0).appendTo('body');
                        $iframeRender.contents().find('head').append(head);
                        var $body = $iframeRender.contents().find('body');
                        // enough to align images horizontally
                        var $div = $('<div class="wrapper">').width(pageWidth + 20).append(divs);
                        $body.append($div);
                        pageHeight = Math.max(pageHeight, $iframeRender.contents().height());
                        // div's height is necessary to be rendered as non-transparent image
                        $div.height(pageHeight);
                        _captureFrame($iframeRender.get(0), $.extend(options, { height: -1 }), function (canvas) {
                            var context = canvas.getContext('2d');
                            context.fillStyle = 'gray';
                            context.font = 'bold 18px Arial';
                            context.fillText('Captured from webida.org', 0, 18);
                        }).then(function (data) {
                            $iframeRender.remove();
                            deferred.resolve(data);
                        });
                    }
                });
        });
        return deferred.promise;
    };

    function _getBody(iframe) {
        var iframeDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
        return iframeDoc.getElementsByTagName('body')[0];
    }

    function _captureFrame(frame, options, canvasCallback) {
        var deferred = new Deferred();

        html2canvas(_getBody(frame), {
            base: options.base,
            allowTaint: false,
            taintTest: false,
            useCORS: true,
            height: (options.height < 0) ? null : options.height,
            onrendered: function (canvas) {
                if (canvasCallback) {
                    canvasCallback(canvas);
                }
                var data = canvas.toDataURL('image/png');
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    }

    return Capture;
});
