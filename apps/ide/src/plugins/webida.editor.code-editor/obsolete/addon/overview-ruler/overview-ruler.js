/* global CodeMirror */
/*jshint unused:false*/

(function (mod) {
    'use strict';
    if (typeof exports === 'object' && typeof module === 'object') {// CommonJS
        mod(require('external/codemirror/lib/codemirror'));
    } else if (typeof define === 'function' && define.amd) {// AMD
        define(['external/codemirror/lib/codemirror'], mod);
    } else {// Plain browser env
        mod(CodeMirror);
    }
})(function (CodeMirror) {
    'use strict';

    var showingRuler = false;


    function showOverviewRuler(cm) {
        var wrapper = cm.getWrapperElement();

        var parentElement = wrapper.parentElement;
        var rulerElement = document.createElement('div');
        var rulerWidth = '10px';
        var cursorHeight = '3px';
        var rulerCursorElement = rulerElement.appendChild(document.createElement('div'));

        rulerCursorElement.style.position = 'absolute';
        rulerCursorElement.style.top = '20px';
        rulerCursorElement.style.left = '0px';
        rulerCursorElement.style.right = '0px';
        rulerCursorElement.style.bottom = '0px';
        rulerCursorElement.style.height = cursorHeight;
        rulerCursorElement.style.border = '1px solid navy';
        rulerCursorElement.style.margin = '0 0 0 0';
        rulerCursorElement.style.padding = '0 0 0 0';
        rulerCursorElement.style['z-index'] = 2;

        rulerElement.className = 'webida-overview-ruler';
        parentElement.insertBefore(rulerElement, wrapper);

        rulerElement.style.position = 'absolute';
        rulerElement.style.top = '0px';
        rulerElement.style.right = '0px';
        rulerElement.style.bottom = '0px';
        rulerElement.style.margin = '0 0 0 0';
        rulerElement.style.background = '#00ff00';
        rulerElement.style.width = rulerWidth;
        rulerElement.style['z-index'] = 1;

        wrapper.style.right = rulerWidth;

        function updateRuler(cm) {
            var scrollInfo = cm.getScrollInfo();
            var rect = rulerElement.getBoundingClientRect();

            var newTop = Math.floor(scrollInfo.top * rect.height / scrollInfo.height);
            rulerCursorElement.style.top = newTop + 'px';

            var newHeight = Math.floor(scrollInfo.clientHeight * rect.height / scrollInfo.height) + 1;
            rulerCursorElement.style.height = newHeight + 'px';

        }

        CodeMirror.on(rulerElement, 'click', function (e) {
            /* jshint camelcase: false */
            CodeMirror.e_preventDefault(e);
            /* jshint camelcase: true */
            var rect = rulerElement.getBoundingClientRect();
            var scrollInfo = cm.getScrollInfo();
            var newScrollTop = (e.clientY - rect.top) * scrollInfo.height / rect.height;
            cm.scrollTo(scrollInfo.left, newScrollTop);
            updateRuler(cm);
        });

        cm.on('update', updateRuler);
        cm.on('viewportChange', updateRuler);
    }

    function closeOverviewRuler(cm) {
        var wrapper = cm.getWrapperElement();
        $(wrapper).css({ right: '0px' });
    }

    
    function RulerAnnotation(cm, options) {
        //TODO
    }


    CodeMirror.defineOption('overviewRuler', showingRuler, function (cm, val, old) {
        if (old && old !== CodeMirror.Init) {
            closeOverviewRuler(cm);
            showingRuler = false;
        }

        if (val) {
            showOverviewRuler(cm);
            showingRuler = true;
        }
    });

    CodeMirror.defineExtension('createRulerAnnotationClass', function (options) {
        if (typeof options === 'string') {
            options = {className: options};
        }
        return new RulerAnnotation(this, options);
    });
});
