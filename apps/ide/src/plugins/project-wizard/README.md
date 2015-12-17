# Project Wizard Plugin

## Overview

Users can create projects from installed templates through this plugin.
And this plugin provides miscellaneous functionality for run, debug, build and test for mobile platform that is maintained no more.

## Structure

```
project-wizard
 ├── build
 │ ├── build.js
 │ ├── buildProfile.js
 │ ├── build-menu.js
 │ ├── buildProfile-*.js                    - UI manager for build profile dialog, subclass of dialog.js
 │ └── signing-*.js                         - UI manager for signing dialog, subclass of dialog.js
 ├── device
 │ ├── device.js                            - List UI for devices
 │ ├── device-select.js                     - UI manager for device selection dialog, subclass of dialog.js
 │ └── gcm.js
 ├── images                                 - image resources
 ├── layer                                  - template for views
 ├── lib                                    - third-party libraries and utils
 ├── nls                                    - i18n resources
 ├── constants.js                           - constants
 ├── dialog.js                              - Dialog supplementation and parent class for all dialog
 ├── frames.json                            - this is for 3rd-party library named Frames of Responsivator
 ├── launcher.js                            - runners for various targets (cordova, weinre or device)
 ├── main.js                                - manager for project templates
 ├── messages.js                            - message constants
 ├── plugin.js                              - main module of this plugin
 ├── plugin.json
 ├── README.md
 ├── *-commands.js                          - subclass for view-commands
 └── view-commands.js                       - Manage view UI and its actions
```

## Plan To Do

- This plugin SHOULD be separated into small pieces of plugins.
    - There remains a lot of codes related with run, debug, build and test especially for programming on mobile platform.
- Remove unnecessary dependencies from this plugin
    - Many libraries was added for only this plugin. That needs to be replaced with the dojo widget or implemented more simple ways.
    - And use common libraries
- Unmanaged features are needed to be cleared.