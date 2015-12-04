define({
    alertFailedToInitTopLevelMenu: 
        'Failed to initialize the top-level menu: ${msg}',
    alertInvalidShortcutKeyString: 
        'Error: Invalid shortcut key string "${keys}" from plug-in ${plugin}',
    alertKeyboardInputFocusIsOutOfWorkbench: 
        'Keyboard input focus is out of workbench',
    alertFailedToInitTheContextMenuOf: 
        'Failed to initialize the context menu of ${plugin}: ${msg}',
    alertNoFocusedElementToReceiveKeyboardInput: 
        'No focused element to receive keyboard input',
    alertModuleDoesNotHaveAFunctionToComputeViableMenuItems:
        'Module "${module}" does not have a function named "${function}" to compute viable menu items',
    alertInvalidViableMenuItemsFromAPlugin:
        'Invalid viable menu items from a plugin ${plugin}: ${msg}',
    alertErrorOccurredWhileBuildingEnabledMenuItems:
        'Error occurred while building enabled menu items: ${msg}',
    
    workspaceSelectionDialogTitle: 'Switch Workspace',
    workspaceSelectionDialogOk: 'OK',
    workspaceSelectionDialogCancel: 'Cancel',

    shortcutKeysSettingDialogTitle: 'Setting Shortcut Keys',
    shortcutKeysSettingDialogReset: 'Reset',
    shortcutKeysSettingDialogSave: 'Save',
    shortcutKeysSettingDialogCancel: 'Cancel',

    shortcutsDialogTitle: 'Shortcuts',
    shortcutsDialogClose: 'Close',

    unsavedChangedDialogTitle: 'Unsaved Changes in the File',
    unsavedChangedDialogSaveAnd: 'Save and ${title}',
    unsavedChangedDialogcloseWithoutSave: '${title} without Saving',
    unsavedChangedDialogCancel: 'Cancel',

    commandListDialogTitle: 'Run Command from List',
    commandListDialogRun: 'Run',
    commandListDialogCancel:  'Cancel',

    notifySelectACommand: 'Select a command',
    notifyNoSuchCommand: 'No such command',
    notifyInvalidCommandSpecification: 'Invalid command specification from a plug-in',

    notifyNoCommandsBoundToTheShortcutViable: 'None of the commands "${cmd}' +
    '" bound to the shortcut "${keys}" is viable in the current context of ${plugin}.',
    notifyMoreThanOneCommandsAreBoundToTheTheShortcut: 'More than one commands "${cmd}"' +
    ' are bound to the shortcut "${keys}" in the current context of ${plugin}.',
    notifyNoSuchItem: 'Error: no such item: ${itemPath}',
    notifyInvalidTerminalItemType: 'Invalid terminal item type: ${itemType}',
    notifyNoSuchFunctionInTheModule: 'No such function ${func} in the module ${module}',
    notifyTheViableItemIsNotAValidTerminalMenuItem:
    'The viable item is not a valid terminal menu item',
    notifyTheCommandIsNotViable: 'The command "${cmd}"' +
    ' is not viable in the current context of  ${plugin}.',
    notifyModuleHaveToImplementAFunctionNamed: 'Module ${module}' +
    ' have to implement a function named ${func}',
    notifyNonTerminalMenuItemInvoked: 'Internal Error:' + 
    ' Non-terminal menu item invoked: ${itemPath}',
});
