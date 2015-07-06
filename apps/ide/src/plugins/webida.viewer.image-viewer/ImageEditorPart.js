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

define([
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/util/gene',
    'webida-lib/plugins/workbench/ui/Part',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'dojo/domReady!'
], function(
	app,
	pathUtil,
	gene,
	Part,
	EditorPart,
	topic,
	Logger
) {
    'use strict';

    var logger = new Logger();

	var dom = {
		getStyle : function(element, prop){
			var styles = window.getComputedStyle(element);
			return styles.getPropertyValue(prop);
		},
		setStyles : function(element, propSet){
			var prop, style = element.style;
			for(prop in propSet){
				style.setProperty(prop, propSet[prop]);
			}
		},
	}

    function ImageEditorPart(file){
        logger.info('new ImageEditorPart('+file+')');
        console.info('file = ', file);
        EditorPart.apply(this, arguments);
        this.setFile(file);
        this.fileOpenedHandle = null;
    }

    gene.inherit(ImageEditorPart, EditorPart, {

		initialize : function(){
			logger.info('initialize()');
			this.initializeListeners();
		},

		initializeListeners : function(){
			logger.info('initializeListeners()');
			var that = this;
			//subscribe topic
		    this.fileOpenedHandle = topic.subscribe('file.opened', function(file, content){
		    	//do something with file.opened topic
		    });
		},

		renderImage : function(){
			console.info('renderImage()');
			var fs = app.getFSCache();
			var parent = this.getParentElement();
			var arr = pathUtil.dividePath(this.getFile().getPath());
	        var dir = arr[0];
	        var fileName = arr[1];
	        fs.addAlias(dir, 10, function (err, alias) {
	        	 if (err) {
	        	 	toastr.error(
	        	 		'Failed to add an alias for the path of the file (' + err + ')'
	        	 	);
	        	 } else {
	        	 	var isFull = true;
	        	 	var img = new Image();
	        	 	img.src = alias.url + '/' + fileName;
	        	 	img.addEventListener('load', function(event){
	        	 		var div = document.createElement('DIV');
	        	 		div.setAttribute('style', 'width:100%; height:100%; overflow:auto');
	        	 		div.appendChild(this);
	        	 		parent.appendChild(div);
	        	 		ImageEditorPart.setZoomCursor(this);
	        	 	});
	        	 	img.addEventListener('click', function(event){
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

        create: function (parent, callback) {
			logger.info('create('+parent.tagName+', callback)');
			if (this.getFlag(Part.CREATED) === true) {
				return;
			}
			this.setParentElement(parent);
            this.initialize();
            this.renderImage();
            this.setFlag(Part.CREATED, true);
        },

        destroy: function () {
            console.info('destroy()');
			//unsubscribe topic
			if(this.fileOpenedHandle !== null){
				logger.info('this.fileOpenedHandle.remove()');
				this.fileOpenedHandle.remove();
			}
			//clear state
			this.setFlag(Part.CREATED, false);
        },

        show: function () {
            console.info('show()');
        },

        hide: function () {
            console.info('hide()');
        },

        getValue: function () {
            console.info('getValue()');
        },

        addChangeListener: function (callback) {
            console.info('addChangeListener()');
        },

        focus: function () {
            console.info('focus()');
        },

        markClean: function () {
            console.info('markClean()');
        },

        isClean: function () {
            console.info('isClean()');
        }

    });

	ImageEditorPart.sizeToFit = function(img){
 		var style;
 		var parent = img.parentNode;
 		var parentBounds = parent.getBoundingClientRect();
 		var imgRatio = img.naturalWidth / img.naturalHeight;
 		var parentRatio = parentBounds.width / parentBounds.height;
	    if (imgRatio < parentRatio) {
	    	dom.setStyles(img, {width:'auto', height:'100%'});
	    } else {
	    	dom.setStyles(img, {width:'100%', height:'auto'});
	    }
	};

	ImageEditorPart.sizeToOrigin = function(img){
		dom.setStyles(img, 
			{width:img.naturalWidth+'px', 
			height:img.naturalHeight+'px'});
	};

 	ImageEditorPart.setZoomCursor = function(img){
 		var parent = img.parentNode;
 		var imgRect = img.getBoundingClientRect();
 		var parentRect = parent.getBoundingClientRect();
 		//case if fit to screen
 		if(imgRect.width === parentRect.width ||
 			imgRect.height === parentRect.height){
 			if(img.naturalWidth > parentRect.width ||
 				img.naturalHeight > parentRect.height){
 				dom.setStyles(img, {cursor:'zoom-in'});
 			}else{
 				dom.setStyles(img, {cursor:'zoom-out'});
 			}
 		//case of original size
 		}else{
 			if(img.naturalWidth > parentRect.width ||
 				img.naturalHeight > parentRect.height){
 				dom.setStyles(img, {cursor:'zoom-out'});
 			}else{
 				dom.setStyles(img, {cursor:'zoom-in'});
 			}
 		}
 	};

    return ImageEditorPart;
});
