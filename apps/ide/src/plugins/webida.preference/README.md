# Preference Plugin

## Overview

This plugin makes creating, editing, removing on preference values and notifying its changes possible.
You can access and listen these values using scope-based `PreferenceService` returned by `PreferenceServiceFactory.get()` method.

`Scope` means the applicable range of preference.
For example, `WORKSPACE` scoped preference is only accessible by 'WORKSPACE'-scoped PreferenceService.
But if `PROJECT` scoped preference for same preference ID doesn't override parent(WORKSPACE) scope values,
'WORKSPACE' scoped preference values is also accessible by 'PROJECT'-scoped PreferenceService.

## Structure

```
webida.preference
 ├── layout
 │ ├── preference.html                      - main layout
 │ └── preference-tree.html                 - tree layout
 ├── pages                                  - PreferencePage implementations
 ├── services                               - PrefereceService implementations
 ├── style
 │ ├── image
 │ ├── simple-page-style.css                - style declaration for SimplePage
 │ └── style.css
 ├── plugin.js
 ├── plugin.json
 ├── preference-manager.js                  - Preference file manager
 ├── preference-store.js                    - Preference model for each Preference Page
 ├── README.md
 ├── tree-view-controller.js                - managing on tree layout, css and UI events
 └── view-controller.js                     - managing on layout, css and UI events
```

## Extensions

### webida.preference:pages

- id(string): preference ID
- hierarchy(string): preference category
    - If it is empty string, this preference will be shown as root item.
    - e.g. "ancestor-preference-id/parent-preference-id"
- name(string): Preference name used by UI label
- page(string): PreferencePage Class
    - e.g. "SimplePage": Using default "SimplePage" class
    - e.g. "to/class/module/path/CustomPage": Using custom "CustomPage" class
- pageData(function): name of the method to get additional data for PreferencePage instance
- getDefault(function): name of the method to get default values
- scope(Array|string): valid ranges of scope(`USER`, `WORKSPACE`, `PROJECT`)
    - e.g. `["USER", "WORKSPACE"]`: This preference is only accessible in `USER` or `WORKSPACE` scope
    - e.g. `"PROJECT"`: The preference is only accessible in `PROJECT` scope
