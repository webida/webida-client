# Run Configuration Plugin

## Overview

This plugin makes creating, editing, removing, and running run/debug configurations possible.
And it also provides extension points for supporting varied type of run configuration.

## Structure

webida.ide.project-management.run
 ├── layout
 │ ├── default-run-configuration.html       - sub layout
 │ └── run-configuration.html               - main layout
 ├── style
 │ ├── image
 │ └── style.css
 ├── delegator.js                           - delegating for actions (CRUD and Run/Debug)
 ├── plugin.js
 ├── plugin.json
 ├── README.md
 ├── run-configuration-manager.js           - managing on model of run configuration and file
 └── view-controller.js                     - managing on layout, css and UI events

## Extensions

### webida.ide.project-management.run:type

- id(string): run type
- name(string): type name (label)
- hidden(boolean): hiding this type on run configuration UI

### webida.ide.project-management.run:configuration

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

### webida.ide.project-management.run:runner

- type(string): run type
- run(function(runConf, callback))
    - runConf: run configuration object
    - callback(err, runConf): callback should be called before starting to run
- debug(function(runConf, callback))
    - runConf: run configuration object
    - callback(err, runConf): callback should be called before starting to debug

### webida.ide.project-management.run:hook

- type(string): run type
- beforeLaunch(function(projectInfo, mode, callback))
    - projectInfo: project information of target project
    - mode: 'RUN' or 'DEBUG'
    - callback(err): callback to be called after ending `beforeLaunch`
