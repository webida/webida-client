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
 * webida - preview plugin handler for Image
 *
 */

define([
    'dojo/i18n!../nls/resource',
    'dojo/string',
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/util/notify',
    'dijit/registry',
    'dijit/form/Button',
    'text!../layout/image-toolbar.html'
], function (
    i18n,
    string,
    app,
    pathUtil,
    notify,
    reg,
    Button,
    toolbarTemplate
) {
    'use strict';

    var fsMount = app.getFSCache();

    // constructor
    function _showImageToolbar() {
        //$('#preview-default-toolbar').fadeOut();
        $('#preview-image-toolbar').fadeIn();
    }

    function _resizeImage(scale) {
        var $imgElem = $('.preview-content-panel').find('img');
        if (!!$imgElem && $imgElem.length > 0) {
            var w = 0;
            var h = 0;

            w = parseInt($('.iv-info-size').attr('defaultSizeW'), 10);
            h = parseInt($('.iv-info-size').attr('defaultSizeH'), 10);
            if (scale > 500 || scale < 10) {
                return;
            } else if (scale !== 100) {
                var s = ((scale - 100) / 100);
                w += Math.floor(w * s);
                h += Math.floor(h * s);

                if (w < 1 || h < 1) {
                    return;
                }
            }

            $('.iv-img-scale').text(scale + '%');
            $imgElem.css('width', w + 'px').css('height', h + 'px');
            $('.iv-info-size').text(w + ' X ' + h);
        }
    }

    function _initImagePreview() {
        // create image preview toolbar's button
        var lbt = new Button({label: '+'}, dojo.query('#img-larger-button')[0]);
        var sbt = new Button({label: '-'}, dojo.query('#img-smaller-button')[0]);

        // event
        dojo.connect(lbt, 'onClick', function () {
            var scale = parseInt($('.iv-img-scale').text().replace('%', ''), 10) + 10;
            _resizeImage(scale);
        });
        dojo.connect(sbt, 'onClick', function () {
            var scale = parseInt($('.iv-img-scale').text().replace('%', ''), 10) - 10;
            _resizeImage(scale);
        });
    }

    function destroy() {
        dijit.byId('img-larger-button').destroyRecursive();
        dijit.byId('img-smaller-button').destroyRecursive();
    }

    function preview(path) {
        $('.preview-toolbar-ext-panel').html(toolbarTemplate);

        _initImagePreview();
        _showImageToolbar();
        var arr = pathUtil.dividePath(path);
        var parent = arr[0];
        var name = arr[1];
        fsMount.addAlias(parent, 10, function (err, aliasData) {
            if (err) {
                notify.error(
                    string.substitute(i18n.failedNotifyImageFile, {err : err}));
            } else {
                var $imgElem = $('.preview-content-panel').find('img');
                if (!!$imgElem && $imgElem.length > 0) {
                    $imgElem.remove();
                }

                // show
                var imageObj = new Image();
                imageObj.onload = function () {
                    var imgWidth = imageObj.naturalWidth;
                    var imgHeight = imageObj.naturalHeight;
                    $('.iv-info-size').text(imgWidth + ' X ' + imgHeight);
                    $('.iv-info-size').attr('defaultSizeW', imgWidth);
                    $('.iv-info-size').attr('defaultSizeH', imgHeight);
                };
                imageObj.src = aliasData.url + '/' + name;
                $('.preview-content-panel').append(imageObj);

                $('.preview-toolbar-ext-panel').css('color', '#494949');
                reg.byId('img-larger-button').set('disabled', false);
                reg.byId('img-smaller-button').set('disabled', false);
            }
        });
    }

    return {
        preview: preview,
        destroy: destroy
    };
});
