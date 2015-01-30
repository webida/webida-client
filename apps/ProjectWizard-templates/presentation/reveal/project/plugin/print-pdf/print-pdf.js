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
 * phantomjs script for printing presentations to PDF.
 *
 * Example:
 * phantomjs print-pdf.js "http://lab.hakim.se/reveal-js?print-pdf" reveal-demo.pdf
 *
 * By Manuel Bieh (https://github.com/manuelbieh)
 */

// html2pdf.js
var page = new WebPage();
var system = require( 'system' );

page.viewportSize  = {
	width: 1024,
	height: 768
};

page.paperSize = {
	format: 'letter',
	orientation: 'landscape',
	margin: {
		left: '0',
		right: '0',
		top: '0',
		bottom: '0'
	}
};

var revealFile = system.args[1] || 'index.html?print-pdf';
var slideFile = system.args[2] || 'slides.pdf';

if( slideFile.match( /\.pdf$/gi ) === null ) {
	slideFile += '.pdf';
}

console.log( 'Printing PDF...' );

page.open( revealFile, function( status ) {
	console.log( 'Printed succesfully' );
	page.render( slideFile );
	phantom.exit();
} );

