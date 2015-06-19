## Part Architecture ##

### Release Notes ###
* Following picture shows inheritance of Parts.
* Blue parts has been implemented ODP 1.2.0
* Gray parts will be implemented int the next releases.
* In ODP 1.2.0 webida.editor.text-editor supports all type of files. (except for audio, video)
* In ODP 1.3.0 webida.editor.code-editor will support code-based files. (Such as .js, .css, .html, .java..)
* In ODP 1.4.0 webida.editor.web-editor and webida.editor.java-editor will support above files.

### Merits ###
* You can make new Editor easily by inheriting from exsisting EditorPart Classes. (Such as EditorPart, TextEditor..)
* By introducing EditorContext, you can choose the editor you prefer. (Codemirror, ace, ... etc)
* By refactoring and distributing code to their Classes, now codes has become more maintainable.

![Parts](https://raw.githubusercontent.com/webida/webida-client/master/common/src/webida/plugins/workbench/ui/doc/Parts.png).
