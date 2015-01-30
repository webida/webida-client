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

exports.name = "Atom (1.0)";
exports.file = "/Atom_Example.xml";
exports.expected = {
	type: "atom",
	id: "urn:uuid:60a76c80-d399-11d9-b91C-0003939e0af6",
	title: "Example Feed",
	link: "http://example.org/feed/",
	description: "A subtitle.",
	updated: new Date("2003-12-13T18:30:02Z"),
	author: "johndoe@example.com",
	items: [{
		id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
		title: "Atom-Powered Robots Run Amok",
		link: "http://example.org/2003/12/13/atom03",
		description: "Some text.",
		pubDate: new Date("2003-12-13T18:30:02Z")
	}]
};