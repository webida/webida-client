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
	// don't emit events from inside the previews themselves
	if ( window.location.search.match( /receiver/gi ) ) { return; }

	var socket = io.connect(window.location.origin);
	var socketId = Math.random().toString().slice(2);
	
	console.log('View slide notes at ' + window.location.origin + '/notes/' + socketId);
	window.open(window.location.origin + '/notes/' + socketId, 'notes-' + socketId);

	// Fires when a fragment is shown
	Reveal.addEventListener( 'fragmentshown', function( event ) {
		var fragmentData = {
			fragment : 'next',
			socketId : socketId
		};
		socket.emit('fragmentchanged', fragmentData);
	} );

	// Fires when a fragment is hidden
	Reveal.addEventListener( 'fragmenthidden', function( event ) {
		var fragmentData = {
			fragment : 'previous',
			socketId : socketId
		};
		socket.emit('fragmentchanged', fragmentData);
	} );

	// Fires when slide is changed
	Reveal.addEventListener( 'slidechanged', function( event ) {
		var nextindexh;
		var nextindexv;
		var slideElement = event.currentSlide;

		if (slideElement.nextElementSibling && slideElement.parentNode.nodeName == 'SECTION') {
			nextindexh = event.indexh;
			nextindexv = event.indexv + 1;
		} else {
			nextindexh = event.indexh + 1;
			nextindexv = 0;
		}

		var notes = slideElement.querySelector('aside.notes');
		var slideData = {
			notes : notes ? notes.innerHTML : '',
			indexh : event.indexh,
			indexv : event.indexv,
			nextindexh : nextindexh,
			nextindexv : nextindexv,
			socketId : socketId,
			markdown : notes ? typeof notes.getAttribute('data-markdown') === 'string' : false

		};

		socket.emit('slidechanged', slideData);
	} );
}());
