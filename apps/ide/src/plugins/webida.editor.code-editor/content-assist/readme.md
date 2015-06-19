# Content Assist

1. [Quick Summary](#quick-summary)
2. [Code Completion](#code-completion)
3. [Quick Help](#quick-help)
4. [Jump To Definition](#jump-to-definition)
5. [Rename](#rename)
6. [Syntax Checking](#syntax-checking)

------------------------------------

## Quick Summary

* Code Completion Activation : **Ctrl-Space**
* Code Completion using other file
```js
/** @ref other-js-file-path.js */
/** @ref other-html-file-path.html */
///<reference path="other-js-file-path.js">
///<reference path="type-definition-file-path.json">
```
* Quick Help Activation : **Ctrl-I**
* Jump to Definition Activation : **Alt-.**
* Rename Activation : **Ctrl-Q**

------------------------------------

## Code Completion
### What is Code Completion
- 현재 컨텍스트 (커서 위치) 에서 유효한 단어를 추천(proposal)해 단어를 모두 키입력 하지 않고 빠르게 코드를 작성할 수 있도록 도와줍니다.
- 유효한 단어 : 키워드, 변수, 함수, html tag/attribute, css property/value 등
- Proposal 이 1개일 경우 자동 완성시켜 줍니다.
- Proposal 이 2개 이상일 경우 팝업창을 띄워 선택할 수 있도록 도와줍니다.
- 효과
- 빠른 키입력이 가능하다.
- 현재 context 에서 사용 가능한 변수/함수 종류를 알 수 있다.
### How to activate
- Manual Activation Using Shortcut
- 단축키 (**Ctrl-Space**) 로 Code Completion 을 실행합니다.
- Auto Activation
- 아직 제공되지 않습니다.

### JavaScript Type Inference
* initialization
```js
var str1 = “string”;  // str1 is string
```

* assignment
```js
var str2 = str1;  // str2 is string
```

* field assignment
```js
var obj = {};
obj.member1 = ‘string’;  // obj has member1, obj.member1 is string
```

* return type from function signature
```js
var num1 = str1.indexOf(“s”);  // num1 is number
```

* function call 을 이용한 parameter type inference
```js
var ClassA = function (param1) { … };	// param1 is string
ClassA(str1);
```

* prototype
```js
ClassA.prototype.method1 = function () {};
var inst1 = new ClassA(str1);    // inst1 has method1
```

* field defined in constructor
```js
var ClassB = function () {
this.method2 = 1;
};
var inst2 = new ClassB();	// inst2 has method2
inst2.method2			// inst2.method2 is number
```

* function implementation 이용 return type inference
```js
function ReturnAsIs(param) {
return param;
}
var str1 = ReturnAsIs(‘aaa’);  // str1 is string
var num1 = ReturnAsIs(123);  // num1 is number
```

* function implementation  이용 parameter field inference
```js
function changeParam(param) {
param.str = ‘string’;
}
var obj = {};
changeParam(obj);
obj.str  // obj has str, obj.str is string
```

* references
* [Tern Demo](http://ternjs.net/doc/demo.html)
* [Codemirror Tern Demo](http://codemirror.net/demo/tern.html)

### JavaScript Type Definition
* JavaScript objects : String, Number, Array, ... [TBD]
* Window object
* Document object
* {TBD]

### AMD Support
* AMD module support
* requirejs
* dojo

### Reference Directive
- JavaScript 파일이 다른 파일에 정의된 객체를 사용할 경우, Type inference engine 에 직접 해당 파일을 알려줄 수 있습니다.

1. JSDoc format
- JSDoc format 으로 **@see** 뒤에 해당 파일을 적어 줍니다.
- ex) /** @see ../main.js */
- ex) /** @see ../index.html */
2. Visual Studio format
- Visual Studio 와 같이 **///&lt;reference** 주석에 해당 파일의 경로를 적어 줍니다.
- ex) ///&lt;reference path="../main.js">
- ex) ///&lt;reference path="jquery-definition.json">

### Support Cases
- JavaScript - Objects
- JavaScript Objects
- Object, Function, Array, String, Number, Boolean, RegExp, Date, Math, ...
- Browser Built-in Objects
- Canvas, Location, DOM Node/Element/Document, WebSocket, Worker, Storage, File, XMLHttpRequest, window, ...
- jQuery Objects
- Underscore Objects
- JavaScript - Type Inference
- [TBD]

- HTML
- Opening Tag
- ex) *from* &lt;bo *to* &lt;bo**dy>**
- Closing Tag
- ex) *from* &lt;div>&lt;/ *to* &lt;div>&lt;/**div>**
- Attribute
- ex) *from* &lt;div accessK *to* &lt;div acce**ssKey**
- Some Attributes Value
- ex) *from* &lt;input type="te *to* &lt;input type="te**xt"**
- CSS
- [TBD]

------------------------------------

## Quick Help
### What is Quick Help
- 현재 커서가 위치한 변수/함수의 정보에 대해 팝업 창으로 알려줍니다.
- 타입 정보
- from type inference
- from type definition file (json format)
- 도움말
- from JSDOC
- from type definition file (json format)

### How to Activate
- Auto Activation
- 함수 인자의 정의부분에 커서가 위치하면 자동으로 Quick Help 가 실행됩니다.
- Manual Activation
- 단축키 (**Ctrl-i**) 로 Quick Help 를 실행합니다.

------------------------------------

## Jump to Definition
### What is Jump to Definition
- JavaScript 에서 현재 커서가 위치한 문자의 정의로 이동한다.
- 변수일 경우, **변수 정의**로 이동
- 함수 호출일 경우, **함수 정의**로 이동

### How to activate
- Manual Activation Using Shortcut
- 단축키 (**Alt-.**) 로 Jump to Definition 을 실행합니다.

### Support Cases
- Jump to definition in current file
- 현재 파일 안에서 definition 으로 커서를 이동합니다.
- Jump to definition in other file
- definition 이 다른 파일에 있을 때, 파일을 에디터에서 열고 해당 위치로 커서를 이동합니다.

------------------------------------

## Rename
### What is Rename
- JavaScript 에서 변수/함수 이름을 변경하고, 해당 변수/함수에 대한 **occurrences 도 같이 변경**해 줍니다.

### How to activate
- Manual Activation Using Shortcut
- 단축키 (**Ctrl-Q**) 로 Rename 을 실행합니다.

### Support Cases
- [TBD]

------------------------------------

## Syntax Checking
### What is Syntax Checking
- 문서 상에서 문법 오류가 있는 곳을 찾아서 어떤 오류인지를 알려줍니다.

### How to activate
- Auto Activation
- validation 은 background 로 항상 동작합니다.

### Support Cases
- HTML
- Validate Elements : Inspect each element in the DOM and reports any elements that are invalid or obsolete
- Validate Element Location : Make sure that elements don't appear as children of parents they're not allowed to descend from.
- Validate Attributes : Inspect there's any attributes that don't belong on a particular element or perhaps don't belong on any element.
- Duplicate IDs : Warn if non-unique IDs are found on the same page
- Unique Elements : Warn if elements that should be unique (like `<title>` and `<main>`) appear more than once in the document.
