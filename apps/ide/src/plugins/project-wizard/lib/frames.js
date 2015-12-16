/**
 * @Frames
 *
 * @version: 1.0.0
 * @since: 2014.04.18
 *
 * Src:
 *   plugins/project-wizard/frames.js
 */
/*
    jQuery Framer
    The jQuery Plugin for adding configurations to responsive design test pages
    by @johnpolacek

    Framer is built upon fine work done by others like <a href="http://mattkersley.com/responsive/">Matt Kersley</a>,
    <a href="http://www.benjaminkeen.com/open-source-projects/smaller-projects/responsive-design-bookmarklet/">Benjamin
    Keen</a> and <a href="https://gist.github.com/1685127">lensco</a>.

    See it in action on Responsivator!
    http://dfcb.github.com/Responsivator


    -----
    USAGE
    -----

    If all you want to do is turn your webpage into a Responsive Design Test Page:
    $.Framer();


    You can customize by doing this:
    var framesArray = [
        { width:320, height:480, label:'Phone (portrait)' },
        { width:480, height:320, label:'Phone (landscape)' }),
        { width:480, height:800, label:'Small Tablet (portrait)' }),
        { width:800, height:480, label:'Small Tablet (landscape)' }),
        { width:768, height:1024, label:'Large Tablet (portrait)' }),
        { width:1024, height:768, label:'Large Tablet (landscape)' }),
        { width:1280, height:800, label:'Desktop' }
    ];
    $.Framer({frames:framesArray});

    Dual licensed under MIT and GPL.
*/

define([],
function () {
    'use strict';

    // constructor
    var Frames = function (options) {
        var defaults = {
            target: 'body'
        };

        var settings = $.extend({}, defaults, options);
        var url = settings.url;
        $.get(url, function (data) {
            var doc = '<div class="frames-wrapper">';
            $.each(settings.frames, function (index, frame) {
                // If set iframe 'src' directly to url,
                // Uncaught SecurityError: Failed to read the 'contentDocument'
                // property from 'HTMLIFrameElement': Blocked a frame with origin
                // "https://devenv.webida.net" from accessing a frame with origin
                // "https://fs.webida.net". Protocols, domains, and ports must match.
                doc += '<div class="frame">' +
                    '<h2>' + frame.width + ' &times; ' + frame.height + ' <small>' + frame.label + '</small></h2>' +
                    '<iframe id="frame-' + index + '" sandbox="allow-same-origin allow-forms allow-scripts" width="' +
                        (parseInt(frame.width, 10)) + '" height="' + frame.height + '"></iframe>' +
                    //'<script type="text/javascript">document.domain = \'' + 'webida.org' + '\';</script>' +
                    '</div>';
            });
            doc += '</div>';

            $(settings.target).html(doc);

            var base = url.substring(0, url.lastIndexOf('/') + 1); // Should end with '/'
            var html = '<base href="' + base + '">' + data;
            $.each(settings.frames, function (index) {
                $('#frame-' + index)[0].contentDocument.write(html);
            });
        });
    };

    return Frames;
});
