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
 * Touch-based remote controller for your presentation courtesy 
 * of the folks at http://remotes.io
 */

(function(window){

    /**
     * Detects if we are dealing with a touch enabled device (with some false positives)
     * Borrowed from modernizr: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touch.js   
     */
    var hasTouch  = (function(){
        return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
    })();

    /**
     * Detects if notes are enable and the current page is opened inside an /iframe
     * this prevents loading Remotes.io several times
     */
    var isNotesAndIframe = (function(){
        return window.RevealNotes && !(self == top);
    })();

    if(!hasTouch && !isNotesAndIframe){
        head.ready( 'remotes.ne.min.js', function() {
            new Remotes("preview")
                .on("swipe-left", function(e){ Reveal.right(); })
                .on("swipe-right", function(e){ Reveal.left(); })
                .on("swipe-up", function(e){ Reveal.down(); })
                .on("swipe-down", function(e){ Reveal.up(); })
                .on("tap", function(e){ Reveal.next(); })
                .on("zoom-out", function(e){ Reveal.toggleOverview(true); })
                .on("zoom-in", function(e){ Reveal.toggleOverview(false); })
            ;
        } );

        head.js('https://raw.github.com/Remotes/Remotes/master/dist/remotes.ne.min.js');
    }
})(window);