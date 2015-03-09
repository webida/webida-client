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
	
	it('should show the correct total number of slides', function() {
		expect($(defaults.selectors.statusTotal)).toHaveText($.deck('getSlides').length);
	});
	
	it('should start at the right current slide', function() {
		expect($(defaults.selectors.statusCurrent)).toHaveText(1);
		$.deck('go', 2);
		$.deck('.slide');
		expect($(defaults.selectors.statusCurrent)).toHaveText(3);
	});
	
	it('should update to the correct number on slide change', function() {
		$.deck('go', 2);
		expect($(defaults.selectors.statusCurrent)).toHaveText('3');
	});
});

describe('countNested false indicator', function() {
	beforeEach(function() {
		loadFixtures('nesteds.html');
		if (Modernizr.history) {
			history.replaceState({}, "", "#")
		}
		else {
			window.location.hash = '#';
		}
		$.deck('.slide', {
			countNested: false
		});
	});
	
	it('should ignore nested slides in the total', function() {
		expect($(defaults.selectors.statusTotal)).toHaveText('5');
	});
	
	it('should update to the root slide number when nested becomes active', function() {
		$.deck('go', 10);
		expect($(defaults.selectors.statusCurrent)).toHaveText('4');
		$.deck('prev');
		expect($(defaults.selectors.statusCurrent)).toHaveText('3');
		$.deck('go', 3);
		expect($(defaults.selectors.statusCurrent)).toHaveText('3');
		$.deck('go', 1);
		expect($(defaults.selectors.statusCurrent)).toHaveText('2');
	});
});