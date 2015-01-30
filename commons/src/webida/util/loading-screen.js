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

define(['webida-lib/util/timedLogger', 'dojo/domReady!'], function () {
    'use strict';
    /* global timedLogger: true */

    var loadingElem;
    var loadingScreen = {
        loadingStart : function () {
            function createLoadingScreen() {
                var docFragment = document.createDocumentFragment();
                loadingElem = document.createElement('div');
                var loadingSpinner = document.createElement('div');
                var loadingEmblem = document.createElement('div');

                loadingElem.setAttribute('id', 'app-loadingscreen-elem');
                loadingElem.setAttribute('class', 'app-loading-elem');
                loadingSpinner.setAttribute('class', 'app-loading-spinner');
                loadingEmblem.setAttribute('class', 'app-loading-emblem');

                docFragment.appendChild(loadingElem);
                loadingElem.appendChild(loadingSpinner);
                loadingElem.appendChild(loadingEmblem);
                document.body.appendChild(docFragment);
            }

            createLoadingScreen();
            timedLogger.log('loading screen put');

            setTimeout(function () {
                loadingScreen.hideLoadingScreen();
            }, 15000);

        },
        hideLoadingScreen : function () {
            function onTransitionEnd(event) {
                if (event.propertyName === 'opacity') {
                    loadingElem.style.display = 'none';
                }
            }

            //loadingElem.addEventListener('webkitTransitionEnd', onTransitionEnd, false);
            loadingElem.classList.add('hide');
            loadingElem.addEventListener('transitionend', onTransitionEnd, false);

        },
    };

    loadingScreen.loadingStart();

    return loadingScreen;
});
