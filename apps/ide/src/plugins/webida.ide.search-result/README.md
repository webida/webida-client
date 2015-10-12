# search-result Plugin

## Overview

This plug-in will be useful for refactoring because it can find and replace text in a workspace.
It has some functionalities as below.
- It can set a search scope such as a workspace, a project, a current directory / file, or directly input path.
- It can search text with regular expressions, ignoring case, and whole words.
- It can replace a text that results in search and can limit replacing scope within checked file or directories.
- Arrow keys are used for navigating around searching result andn enter key are used for opening that file.
- Search results is highlight and file is highlight too on opening file.
- double clicking in search result or opening a file using an enter key will move a cursor to the line that searching text exists.

## Structure

```
webida.ide.search-result
├── layout
│ └── search-result.html        - main layout
├── style
│ └── search-result.css         - main style
├── plugin.js                   - Main plugin module.
├── plugin.json                 - Plugin manifest file.
├── README.md                   - This document.
├── search-result-controller.js - Handles the search result data.
├── search-result-data.js       - Manages the search result data.
├── search-result-model.js      - Making the search result data.
└── search-result-view.js       - Shows up the search result list.
```

## Extensions
### webida.common.workbench:views

## Exntension Points
No extension points.

## Support
If you have any questions, please feel free to ask an author <minsung.jin@samsung.com>
