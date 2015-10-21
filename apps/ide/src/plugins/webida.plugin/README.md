# Plugin Configurator

## Overview

This plugin makes the users can set enabling or disabling on plugins.
The setting is handled by files on `{workspace}/.workspace/plugin-settings.json` those take priority over the default one.

## Structure

```
webida.ide.project-management.run
 ├── dialog-controller.js                   - Controller for view of plugin setting dialog
 ├── plugin.js
 ├── plugin.json
 ├── plugin-settings.js                     - plugin-manager's API wrapper for this plugin
 └── README.md
```
