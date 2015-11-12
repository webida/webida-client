# Deploy Plugin

## Overview

Using this plugin, you can make a your own web application run on the cloud.
The created application will be assigned a unique URL.
And you can access any resources in your project deployed on web browser using the generated URL.

## Structure

```
webida.ide.project.deploy
 ├── layout
 │ ├── app-creation-form.html               - sub layout
 │ ├── app-information.html                 - sub layout
 │ └── deploy-layout                        - main layout
 ├── nls                                    - i18n related resources
 ├── style
 │ ├── images
 │ └── style.css
 ├── content-view-controller.js             - manage list view of app information
 ├── deploy.js                              - get/set basic information
 ├── deploy-commands.js                     - run menu
 ├── plugin.js                              - main module
 ├── plugin.json
 ├── README.md
 └── workspace-view-controller.js           - manage list view of projects
```