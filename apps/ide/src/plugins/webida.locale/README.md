# locale plugin

## Overview
This plugin will add Locale in Preference and change the language associated with a selected locale.

How to add a language:

Add a locale code as an item to the locale of locale-preference.js. In case of German, you can add the locale code like this form, "{label: 'germany', value: 'de-de'}", is following RFC-5646.

Each plugin make a directory associated with a language code in the nls(National Language Support) folder then resource bundles are added in this directory.

## Structure

```
webida.locale
├┬─ nls
│├┬─ en-us                  
││└── resource.js           - english resource bundle.
│└┬─ zh-cn
│ └── resource.js           - chinese resource bundle.
├── plugin.js               - Main plugin module.
├── plugin.json             - Plugin manifest file.
├── README.md               - This document.
├── locale-handler.js       - This file is for managing the changes of Locale in Preference.
└── locale-preference.js    - Thie file is for adding a menu about Locale in Preference
```

## Extensions
### webida.preference:pages

## Exntension Points
No extension points.

## Support
If you have any questions, please feel free to ask an author <minsung.jin@samsung.com>
