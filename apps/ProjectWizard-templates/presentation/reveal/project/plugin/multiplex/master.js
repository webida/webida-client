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

(function() {
	// Don't emit events from inside of notes windows
	if ( window.location.search.match( /receiver/gi ) ) { return; }

	var multiplex = Reveal.getConfig().multiplex;

	var socket = io.connect(multiplex.url);

	var notify = function( slideElement, indexh, indexv, origin ) {
		if( typeof origin === 'undefined' && origin !== 'remote' ) {
			var nextindexh;
			var nextindexv;

			var fragmentindex = Reveal.getIndices().f;
			if (typeof fragmentindex == 'undefined') {
				fragmentindex = 0;
			}

			if (slideElement.nextElementSibling && slideElement.parentNode.nodeName == 'SECTION') {
				nextindexh = indexh;
				nextindexv = indexv + 1;
			} else {
				nextindexh = indexh + 1;
				nextindexv = 0;
			}

			var slideData = {
				indexh : indexh,
				indexv : indexv,
				indexf : fragmentindex,
				nextindexh : nextindexh,
				nextindexv : nextindexv,
				secret: multiplex.secret,
				socketId : multiplex.id
			};

			socket.emit('slidechanged', slideData);
		}
	}

	Reveal.addEventListener( 'slidechanged', function( event ) {
		notify( event.currentSlide, event.indexh, event.indexv, event.origin );
	} );

	var fragmentNotify = function( event ) {
		notify( Reveal.getCurrentSlide(), Reveal.getIndices().h, Reveal.getIndices().v, event.origin );
	};

	Reveal.addEventListener( 'fragmentshown', fragmentNotify );
	Reveal.addEventListener( 'fragmenthidden', fragmentNotify );
}());