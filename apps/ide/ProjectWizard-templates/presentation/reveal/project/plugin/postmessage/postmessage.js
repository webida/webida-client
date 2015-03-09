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

/*

	simple postmessage plugin

	Useful when a reveal slideshow is inside an iframe.
	It allows to call reveal methods from outside.

	Example:
		 var reveal =  window.frames[0];

		 // Reveal.prev(); 
		 reveal.postMessage(JSON.stringify({method: 'prev', args: []}), '*');
		 // Reveal.next(); 
		 reveal.postMessage(JSON.stringify({method: 'next', args: []}), '*');
		 // Reveal.slide(2, 2); 
		 reveal.postMessage(JSON.stringify({method: 'slide', args: [2,2]}), '*');

	Add to the slideshow:

		dependencies: [
			...
			{ src: 'plugin/postmessage/postmessage.js', async: true, condition: function() { return !!document.body.classList; } }
		]

*/

(function (){

	window.addEventListener( "message", function ( event ) {
		var data = JSON.parse( event.data ),
				method = data.method,
				args = data.args;

		if( typeof Reveal[method] === 'function' ) {
			Reveal[method].apply( Reveal, data.args );
		}
	}, false);

}());



