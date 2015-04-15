# css-parse [![Build Status](https://travis-ci.org/visionmedia/css-parse.png)](https://travis-ci.org/visionmedia/css-parse)

JavaScript CSS parser for nodejs and the browser.

## Example

css:

```css
body {
background: #eee;
color: #888;
}
```

parse tree:

```json
{
"type": "stylesheet",
"stylesheet": {
"rules": [
{
"type": "rule",
"selectors": [
"body"
],
"declarations": [
{
"type": "declaration",
"property": "background",
"value": "#eee"
},
{
"type": "declaration",
"property": "color",
"value": "#888"
}
]
}
]
}
}
```

parse tree with `.position` enabled:

```json
{
"type": "stylesheet",
"stylesheet": {
"rules": [
{
"type": "rule",
"selectors": [
"body"
],
"declarations": [
{
"type": "declaration",
"property": "background",
"value": "#eee",
"position": {
"start": {
"line": 3,
"column": 3
},
"end": {
"line": 3,
"column": 19
}
}
},
{
"type": "declaration",
"property": "color",
"value": "#888",
"position": {
"start": {
"line": 4,
"column": 3
},
"end": {
"line": 4,
"column": 14
}
}
}
],
"position": {
"start": {
"line": 2,
"column": 1
},
"end": {
"line": 5,
"column": 2
}
}
}
]
}
}
```

If you also pass in `source: 'path/to/original.css'`, that will be set
on `node.position.source`.

## Performance

Parsed 15,000 lines of CSS (2mb) in 40ms on my macbook air.

## License

MIT
















# css-stringify [![Build Status](https://travis-ci.org/visionmedia/css-stringify.png)](https://travis-ci.org/visionmedia/css-stringify)

  CSS compiler using the AST provided by [css-parse](https://github.com/visionmedia/css-parse).

## API

### stringify(object, [options])

  Accepts an AST `object` from css-parse and returns a CSS string.

```js
var stringify = require('css-stringify');
var parse = require('css-parse');

var ast = parse('body { font-size: 12px; }');
var css = stringify(ast);
```

  Optionally you may `compress` the output:

```js
var css = stringify(ast, { compress: true });
```

  Or return a `sourcemap` along with the CSS output,
  which requires the use of the css-parse `position` option.

```js
var ast = parse('body { font-size: 12px; }', { position: true });
var result = stringify(ast, { sourcemap: true });

result.code // string with CSS
result.map // source map
```

## Performance

  Formats 15,000 lines of CSS (2mb) in 23ms on my macbook air.

## License

(The MIT License)

Copyright (c) 2012 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
