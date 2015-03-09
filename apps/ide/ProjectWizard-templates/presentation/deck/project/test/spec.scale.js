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

describe('Deck JS Status Indicator', function() {
	beforeEach(function() {
		loadFixtures('standard.html');
		if (Modernizr.history) {
			history.replaceState({}, "", "#")
		}
		else {
			window.location.hash = '#';
		}
		$.deck('.slide');
	});
	
	it('should start with scaling enabled', function() {
		expect($.deck('getContainer')).toHaveClass(defaults.classes.scale);
	});
	
	describe('disableScale()', function() {
		it('should remove the scale class from the container', function() {
			$.deck('disableScale');
			expect($.deck('getContainer')).not.toHaveClass(defaults.classes.scale);
		});
	});
	
	describe('enableScale()', function() {
		it('should add the scale class to the container', function() {
			$.deck('disableScale');
			$.deck('enableScale');
			expect($.deck('getContainer')).toHaveClass(defaults.classes.scale);
		});
	});
	
	describe('toggleScale()', function() {
		it('should toggle between adding and removing the scale class', function() {
			$.deck('toggleScale');
			expect($.deck('getContainer')).not.toHaveClass(defaults.classes.scale);
			$.deck('toggleScale');
			expect($.deck('getContainer')).toHaveClass(defaults.classes.scale);
		});
	});
	
	describe('key bindings', function() {
		var e,
		$d = $(document);

		beforeEach(function() {
			e = jQuery.Event('keydown.deckscale');
		});
		
		it('should toggle scaling if the specified key is pressed', function() {
			e.which = 83; // s
			$d.trigger(e);
			expect($.deck('getContainer')).not.toHaveClass(defaults.classes.scale);
			$d.trigger(e);
			expect($.deck('getContainer')).toHaveClass(defaults.classes.scale);
		});
	});
});