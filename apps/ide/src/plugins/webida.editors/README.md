editors plugin
=============

`editors` module exports general editor operations. It provides `webida.common.editors:editor` extension point which is extended by other plugins that implement editor details. Specific editor is used based on the file extensions or mime types.

## Extension Points
### webida.common.editors:editor
This can be extended for detailed detailed editor implementations

* name: string
    * ..
* fileValueRequired: bool
    * ..
* handledFileExt: array
    * ..
* handledMimeTypes: array
    * ..
* unhandledFileExt: array
    * ..
* unhandledMimeTypes: array
    * ..

* handledFileNames: array
    * Specify file names to open with your editor plug-in
    * This will override handledFileExt, handledMimeTypes

### webida.common.editors:menu
This can be extended for populate editor menu items

* location: string
    * ..
* wholeItems: object
    * ..
* getViableItems: function
    * ..

## Extensions
...

#### editors.clean.current ()
current file is clean(not dirty)
?

#### editors.clean.all ()
all files are clean(not dirty)
?

#### editors.dirty.current ()
current file is dirty
?

#### editors.dirty.some ()
some files are dirty
?

#### editors.selected (filePath, file)
editor is selected (ie. shown on top)

#### editors.nofile.current ()
no file is selected

#### editors.focused (filePath, file)
editor is focused
?

#### view.close (event, onClose)
Published when file is closed

    event {
      name: 'view.close',
      viewContainer: ViewContainer
      view: View,
      closable: true,
      force: ?
      noClose: ?
    }

    onClose ? callback that should be called by actual event handler

?

#### file.content.changed (filePath, fileContent)
Published when file is changed
?

#### file.opened (file)
file is opened
?

#### file.saved (file)
file is saved
?

#### file.closed (file)
file is closed
