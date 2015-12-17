# Project Configurator Plugin

## Overview

This plugin plays a role of management on configurations(information) all project from `.project/project.json` file.
When projects are changed, this plugin will automatically apply these changes to the file and its managed objects.
Also other plugins that requires access to the configurations of any plugin can use service module that has been provided.

The form of the project configuration file, for example:

```json
{
    "name": "testProject",
    "description": "",
    "created": "Thu, 17 Dec 2015 08:17:19 GMT",
    "lastmodified": "Thu, 17 Dec 2015 08:17:19 GMT",
    "type": ""
}
```

## Structure

```
project-configurator
 ├── plugin.js                      - main module
 ├── plugin.json
 ├── project-info-service.js        - services for external plugins
 ├── projectConfigurator.js         - management configurations of all of the project
 └── README.md
```

## Usage
### Project Information Service

This service has 4 APIs.

* getByPath(path, callback): Get project configuration by file path
* getByName(projectName, callback): Get project configuration by project name
* getAll(callback): Get all project configuration in current workspace
* set(projectName, configurationObject, callback): Set project information to the project information file

You can require `plugins/project-configurator/project-info-service` module at any plugin and use it.

``` javascript
require([
    ...,
    'plugins/project-configurator/project-info-service'
], function (
    ...,
    projectService
) {
    ...
    
    // get configuration
    var projectConfiguration = projectService.getByPath(pathToSomeFile);
    
    // set configuration
    projectService.set(projectConfiguration.name, projectConfiguration, function(err) {
        // handle error case
    });
    
    ...
});
```

## Plan To Do

- There are no more used and updated fields in configuration object. That SHOULD be fixed later.
- When creating project by the project wizard plugin, making project configuration file SHOULD depend on this plugin.