### 0.5.1 (August 31, 2013)

* Fix incorrectly reporting version number from CLI.

### 0.5.0 (August 31, 2013)

* Add `excludeRules` option.
* Rename the `exclude` option to `excludeElements`.
* Rename the `excludeSubtree` option to `excludeSubtrees`.
* Remove the setConfig method as it was overwriting previous setConfigs if there were multiple calls.
* Improve the CLI and allow for async error reporting via the config file.
* Convert HTML Inspector to be built with Browserify and released as a UMD module.
* Convert tests from Jasmine to Mocha, Sinon, and Chai.
* Remove the custom builds in favor better rule inclusion/exclusion options.

### 0.4.1 (July 10, 2013)

* Update bower.json to the correct version.

### 0.4.0 (July 10, 2013)

* Add a basic command line interface.
* Fix a bug where @import statements weren't being accounted for when traversing the stylesheets.

### 0.3.0 (June 23, 2013)

* Remove the dependency on jQuery
* Add a validate-element-location rule that warns when elements appear as descendants of elements they're not allowed to descend from.
* Remove the scoped-styles rule as it's now covered by the validate-element-location rule.
* Add the ability to exclude DOM elements and DOM subtrees from inspection via the `exclude` and `excludeSubTree` config options.

### 0.2.3 (June 15, 2013)

* Prevent scripts from warning in the script-placement rule if they have the `async` or `defer` attribute.

### 0.2.2 (June 15, 2013)

* Allow a single RegExp to be a rule's whitelist option: previously an array of Regular Expressions (or strings) was required.

### 0.2.1 (June 13, 2013)

* Fix an error in bower.json.

### 0.2.0 (June 13, 2013)

* Update the inspector to not traverse <svg> elements and their children until rules for them can be added.
* Fix a bug where invalid attributes on invalid elements were throwing an error.

### 0.1.1 (June 10, 2013)

* First public release.