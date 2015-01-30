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

define(['webida-lib/webida-0.3',
        'core/ide',
       'text!./image-viewer.html'],
function (webida, ide, markup) {
    'use strict';

    var viewer = {};

    viewer.create = function (file, parentElem, callback) {
        var self = this;

        file.imgviewobj = file.imgviewobj || {};

        var $html = $(markup);
        var $img = $html.find('.imageViewerImage');
        var img = $img[0];

        //ide.getMount().readFile(file.path, function (error, content) {
        ide.getFSCache().readFile(file.path, function (error, content) {
            var binary = '';
            for (var i = 0; i < content.length; i++) {
                binary += String.fromCharCode(content.charCodeAt(i) & 0xff);
            }
            //$img.attr('src', 'data:image/png;base64,' + window.btoa(binary));
        });

        $img.attr('src', webida.conf.fsApiBaseUrl + '/file/' + ide.getFsid() + '/' + file.path);
        $html.appendTo(parentElem);

        file.imgviewobj.scale = 1;
        file.imgviewobj.img = img;
        file.imgviewobj.$divZoom = $html.find('.imageViewerZoom');
        file.imgviewobj.zoomInterval = null;

        $img.on('load', function () {
            self.onScaleChanged(file);
        });

        $html.find('.imageViewerZoomIn').mousedown(function () {
            self.changeScale(file, file.imgviewobj.scale * 1.1);
            file.imgviewobj.zoomInterval = setInterval(function () {
                self.changeScale(file, file.imgviewobj.scale * 1.1);
            }, 200);
        }).mouseup(function () {
            clearInterval(file.imgviewobj.zoomInterval);
        }).mouseleave(function () {
            clearInterval(file.imgviewobj.zoomInterval);
        });

        $html.find('.imageViewerZoomOut').mousedown(function () {
            self.changeScale(file, file.imgviewobj.scale * 0.9);
            file.imgviewobj.zoomInterval = setInterval(function () {
                self.changeScale(file, file.imgviewobj.scale * 0.9);
            }, 200);
        }).mouseup(function () {
            clearInterval(file.imgviewobj.zoomInterval);
        }).mouseleave(function () {
            clearInterval(file.imgviewobj.zoomInterval);
        });

        file.imgviewobj.$html = $html;
    };

    viewer.show = function (file) {
        if (file.imgviewobj) {
            file.imgviewobj.$html.css('display', 'block');
        }
    };

    viewer.hide = function (file) {
        if (file.imgviewobj) {
            file.imgviewobj.$html.css('display', 'none');
        }
    };

    viewer.destroy = function (file) {
        file.imgviewobj = null;
    };

    viewer.changeScale = function (file, newScale) {
        if (newScale > 0.1) {
            var img = file.imgviewobj.img;
            img.style['-webkit-transform'] = 'scale(' + newScale + ')';
            img.style['-moz-transform'] = 'scale(' + newScale + ')';
            img.style['-o-transform'] = 'scale(' + newScale + ')';
            img.style['-ms-transform'] = 'scale(' + newScale + ')';
            img.style['transform'] = 'scale(' + newScale + ')';
            file.imgviewobj.scale = newScale;
            this.onScaleChanged(file);
        }
    };

    viewer.onScaleChanged = function (file) {
        var img = file.imgviewobj.img;
        var $divZoom = file.imgviewobj.$divZoom;
        var scale = file.imgviewobj.scale;
        setTimeout(function () {
            $divZoom.text(Math.floor(scale * 100) + ' %');
        }, 0);
        img.parentNode.style.height = (img.height) * scale + 'px';
        img.parentNode.style.width = (img.width) * scale + 'px';
        img.parentNode.parentNode.style.minHeight = (img.height + 2) * scale + 'px';
        img.parentNode.parentNode.style.minWidth = (img.width + 2) * scale + 'px';

    };

    return viewer;

});
