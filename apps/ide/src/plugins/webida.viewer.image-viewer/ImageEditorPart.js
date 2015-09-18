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
 * Constructor function
 * ImageEditor implementation of EditorPart to show images.
 * This could be an image editor plugin.
 *
 * @constructor
 * @see EditorPart
 * @since: 2015.07.02
 * @author: hw.shim
 *
 */

// @formatter:off
define([
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/util/genetic',
    'webida-lib/plugins/workbench/ui/Part',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/PartContainer',
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'dojo/domReady!'
], function(
    app,
    pathUtil,
    genetic,
    Part,
    EditorPart,
    PartContainer,
    topic,
    Logger
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.off();

    var dom = {
        getStyle: function(element, prop) {
            var styles = window.getComputedStyle(element);
            return styles.getPropertyValue(prop);
        },
        setStyles: function(element, propSet) {
            var prop, style = element.style;
            for (prop in propSet) {
                style.setProperty(prop, propSet[prop]);
            }
        },
    }

    function ImageEditorPart(container) {
        logger.info('new ImageEditorPart(' + container + ')');
        EditorPart.apply(this, arguments);
        var dataSource = container.getDataSource();
        var file = dataSource.getPersistence();
        this.setFile(file);
    }


    genetic.inherits(ImageEditorPart, EditorPart, {

        /**
         * @Override
         */
		prepareVM: function(){
			logger.info('%cprepareVM()', 'color:orange');
			var container = this.getContainer();
			this.createViewer(container.getContentNode());
		},

        initialize: function() {
            logger.info('initialize()');
            this.initializeListeners();
        },

        initializeListeners: function() {
            logger.info('initializeListeners()');
            var that = this;
            //subscribe topic
        },

        renderImage: function() {
            logger.info('renderImage()');
            var fs = app.getFSCache();
            var parent = this.getParentElement();
            var arr = pathUtil.dividePath(this.getFile().getPath());
            var dir = arr[0];
            var fileName = arr[1];
            fs.addAlias(dir, 10, function(err, alias) {
                if (err) {
                    toastr.error('Failed to add an alias for the path of the file (' + err + ')');
                } else {
                    var isFull = true;
                    var img = new Image();
                    img.src = alias.url + '/' + fileName;
                    img.addEventListener('load', function(event) {
                        var div = document.createElement('DIV');
                        div.setAttribute('style', 'width:100%; height:100%; overflow:auto');
                        div.appendChild(this);
                        parent.appendChild(div);
                        ImageEditorPart.setZoomCursor(this);
                    });
                    img.addEventListener('click', function(event) {
                        if (isFull === true) {
                            ImageEditorPart.sizeToFit(img);
                            isFull = false;
                        } else {
                            ImageEditorPart.sizeToOrigin(img);
                            isFull = true;
                        }
                        ImageEditorPart.setZoomCursor(this);
                    });
                }
            });
        },

        createViewer: function(parentNode, callback) {
            logger.info('createViewer(' + parentNode.tagName + ', callback)');
            this.setParentElement(parentNode);
            this.initialize();
            this.renderImage();
        },

        destroy: function() {
            logger.info('destroy()');
            //unsubscribe topic
        },

        hide: function() {
            logger.info('hide()');
        },

        addChangeListener: function(callback) {
            logger.info('addChangeListener()');
        },

        focus: function() {
            logger.info('focus()');
        },

        isClean: function() {
            logger.info('isClean()');
        }
    });

    ImageEditorPart.sizeToFit = function(img) {
        var style;
        var parent = img.parentNode;
        var parentBounds = parent.getBoundingClientRect();
        var imgRatio = img.naturalWidth / img.naturalHeight;
        var parentRatio = parentBounds.width / parentBounds.height;
        if (imgRatio < parentRatio) {
            dom.setStyles(img, {
                width: 'auto',
                height: '100%'
            });
        } else {
            dom.setStyles(img, {
                width: '100%',
                height: 'auto'
            });
        }
    };

    ImageEditorPart.sizeToOrigin = function(img) {
        dom.setStyles(img, {
            width: img.naturalWidth + 'px',
            height: img.naturalHeight + 'px'
        });
    };

    ImageEditorPart.setZoomCursor = function(img) {
        var parent = img.parentNode;
        var imgRect = img.getBoundingClientRect();
        var parentRect = parent.getBoundingClientRect();
        //case if fit to screen
        if (imgRect.width === parentRect.width || imgRect.height === parentRect.height) {
            if (img.naturalWidth > parentRect.width || img.naturalHeight > parentRect.height) {
                dom.setStyles(img, {
                    cursor: 'zoom-in'
                });
            } else {
                dom.setStyles(img, {
                    cursor: 'zoom-out'
                });
            }
            //case of original size
        } else {
            if (img.naturalWidth > parentRect.width || img.naturalHeight > parentRect.height) {
                dom.setStyles(img, {
                    cursor: 'zoom-out'
                });
            } else {
                dom.setStyles(img, {
                    cursor: 'zoom-in'
                });
            }
        }
    };

    return ImageEditorPart;
});
