# Run Configuration Plugin

## Overview

This plugin makes creating, editing, removing, and running run/debug configurations possible.
And it also provides extension points for supporting varied type of run configuration.

## Structure

```
webida.ide.project-management.run
 ├── layout
 │ ├── default-run-configuration.html       - sub layout
 │ └── run-configuration.html               - main layout
 ├── style
 │ ├── image
 │ └── style.css
 ├── default-view-controller.js             - managing on General Web Application view
 ├── delegator.js                           - delegating for actions (CRUD and Run/Debug)
 ├── plugin.js
 ├── plugin.json
 ├── README.md
 ├── run-configuration-manager.js           - managing on model of run configuration and file
 └── view-controller.js                     - managing on layout, css and UI events
```

## Extensions

### webida.ide.project-management.run:type (Mandatory)

- id(string): run type
- name(string): name of this type to display (label)
- hidden(boolean): hiding this type on run configuration UI

### webida.ide.project-management.run:configuration (Mandatory)

- type(string): run type
- newConf(function(content, newRunConf, callback))
    - content: parent node (Dojo widget object)
    - newRunConf: new run configuration object (name and type are predefined)
    - callback(err, runConf): callback should be called after drawing sub UI
- loadConf(function(content, runConf, callback))
    - content: parent node (Dojo widget object)
    - runConf: run configuration object to be loaded
    - callback(err, runConf): callback should be called after drawing sub UI
- saveConf(function(runConf, callback))
    - runConf: run configuration object to be saved
    - callback(err, runConf): callback should be called before saving model
- deleteConf(function(runConfName, callback))
    - runConfName: run configuration object name to be removed
    - callback(err, runConfName): callback should be called before deleting model

### webida.ide.project-management.run:runner (Mandatory)

- type(string): run type
- run(function(runConf, callback))
    - runConf: run configuration object
    - callback(err, runConf): callback should be called before starting to run
- debug(function(runConf, callback))
    - runConf: run configuration object
    - callback(err, runConf): callback should be called before starting to debug

### webida.ide.project-management.run:hook (Optional)

- type(string): run type
- beforeLaunch(function(projectInfo, mode, callback))
    - projectInfo: project information of target project
    - mode: 'RUN' or 'DEBUG'
    - callback(err): callback to be called after ending `beforeLaunch`

## Topics

In webida plugin system, These topics enables inter-plugin communications.
In any plugin that extending `webida.ide.project-management.run:*`, you can send changes on current run configuration to the main plugin `webida.ide.project-management.run`.

### project/run/config/changed

If user have made a change in the extended plugins, this changes should be sent the main plugin using this topic `project/run/config/changed`.
Then the main plugin will decide to enable/disable its button actions or modify tree.
There are two candidates for `changedType`. 'state' and 'save'.

``` javascript

// topic.publish('project/run/config/changed', {changedType}, {changedRunConf}\[, {changedState}\]);

define(['dojo/topic'], function (topic) {
    ...
    topic.publish('project/run/config/changed', 'state', currentRunConf, { isValid: true, isDirty: true });
    ...
    topic.publish('project/run/config/changed', 'save', currentRunConf);
    ...
});
```

#### changedType: state

This type is for notifying changes on current run configuration.
There are two properties of state that should be sent with this notification.

- isValid (boolean): Are all of the User input values valid?
- idDirty (boolean): Is any stuff of the run configuration changed and hasn't saved yet? 

#### changedType: save

If the save action(like 'Apply' button), flushing and applying changed things, is occurred in the extended plugin (not main plugin), 
this topic should be published with the 'save' type and changed run configuration object.

## Usage

First of all, create `plugin.json` file with `extensions` configs in your plugin directory.

* plugin.json

``` javascript
{
    ...
    "extensions": {
        "webida.ide.project-management.run:type" : [
            {
                "id" : "org.webida.run.something",
                "name" : "Something Application",
                "hidden": false
            }
        ],
        "webida.ide.project-management.run:configuration" : [
            {
                "module" : "plugins/webida.ide.project-management.run.something/plugin",
                "name" : "Run As Something Application",
                "type" : "org.webida.run.something",
                "newConf" : "newConf",
                "loadConf" : "loadConf",
                "saveConf" : "saveConf",
                "deleteConf" : "deleteConf"
            }
        ],
        "webida.ide.project-management.run:runner" : [
            {
                "module": "plugins/webida.ide.project-management.run.something/plugin",
                "type" : "org.webida.run.something",
                "run": "run"
            }
        ]
    }
}
```

And implement these declared methods(newConf, loadConf, saveConf, deleteConf and run) at the declared module `plugin`.
This is the most simple example to run.

* plugin.js

``` javascript
define([
    ...,
    'dojo/topic',
    'webida-lib/util/notify'
], function (
    ...,
    topic,
    notify
) {
    function _setTemplate(content) {
        // create some needed components at the form
        ...
        // Set handler for clicking 'apply' button
        content.own(
            on(saveButton, 'click', function () {
                if (form.validate()) {
                    topic.publish('project/run/config/changed', 'save', currentRunConf);
                } else {
                    notify.error(invalidFormMsg);
                }
            })
        );
        ...
    }
    ...
    return {
        run: function (runConf, callback) {
            // execute this runConf
            callback(null, runConf);
        },
        newConf: function (content, runConf, callback) {
            // make ui form and its components with the runConf at this content element
            currentRunConf = runConf;
            _setTemplate(content);
            topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {isValid: form.validate(), isDirty: true });
            callback(null, runConf);
        },
        loadConf: function (content, runConf, callback) {
            // make ui form and its components with the runConf at this content element
            currentRunConf = runConf;
            _setTemplate(content);
            topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, { isValid: form.validate() });
            callback(null, runConf);
        },
        saveConf: function (runConf, callback) {
            // validation and publish 'save' topic to the main plugin
            topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, { isDirty: false });
            callback(null, runConf);
        },
        deleteConf: function (runConfName, callback) {
            callback(null, currentRunConf);
        }
    };
});
```