## Part Architecture ##

### Release Plan ###
* Following picture shows inheritance of Parts.
* Blue parts has been implemented ODP 1.2.0
* Gray parts will be implemented in the next releases.
* In ODP 1.2.0 webida.editor.text-editor supports all type of files. (except for audio, video)
* In ODP 1.3.0 webida.editor.code-editor will support code-based files. (Such as .js, .css, .html, .java..)
* In ODP 1.4.0 webida.editor.web-editor and webida.editor.java-editor will support above files more specifically.

### Merits ###
* You can make new Editor easily by inheriting from existing EditorPart Classes. (Such as EditorPart, TextEditor..)
* By introducing EditorContext, you can choose the editor you prefer. (Codemirror, ace, ... etc)
* By refactoring and distributing code to their Classes, now codes has become more maintainable.
 
### Usage ###
* In order to implement new editor using extension point, You have to use extension point "webida.common.editors:editor" then specify your Part Module's path at "editorPart" property.
* Then, in your Part Module's file you have to extend EditorPart and implement it. (That's all!)
* See the "webida.editor.test-editor" plug-in's plugin.json and TestEditor.js

![Parts](https://raw.githubusercontent.com/webida/webida-client/master/common/src/webida/plugins/workbench/ui/doc/Parts.png).
