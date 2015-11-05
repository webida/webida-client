/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Site router using hashchange
 *
 * @since: 15. 8. 28
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

require([
    'src/js/util'
], function (util) {
    'use strict';
    var router = {
        home: {
            style: {
                'body': {'background-color': '#FFFFFF'}
            },
            showHeader: true,
            showFooter: true
        },
        guest: {
            style: {
                'body': {'background-color': '#3E404D'}
            },
            showHeader: false,
            showFooter: false,
            scripts: ['src/js/guest.js']
        }
    };

    $.ajaxSetup({
        cache: false
    });

    function turnPage(hash) {
        hash = (hash && router[hash]) ? hash : 'home';

        $('.main').empty().load('pages/' + hash + '.html', function () {
            if (router[hash].scripts) {
                require(router[hash].scripts);
            }
        });

        if (router[hash].style) {
            for (var selector in router[hash].style) {
                if (router[hash].style.hasOwnProperty(selector)) {
                    $(selector).css(router[hash].style[selector]);
                }
            }
        }

        if (router[hash].showHeader) {
            $('.header').show();
        } else {
            $('.header').hide();
        }
        if (router[hash].showFooter) {
            $('.footer').show();
        } else {
            $('.footer').hide();
        }
    }

    $(window).on('hashchange', function () {
        var hash = location.hash;
        if (hash.substr(1, 12) === 'access_token') {
            var targetOrigin = util.getLocationOrigin();
            var accessToken = hash.substring(1);
            window.parent.postMessage(accessToken, targetOrigin);
            hash = '';
        }
        hash = hash.replace(/^#/, '');
        turnPage(hash);
    });

    $(window).hashchange();
});
