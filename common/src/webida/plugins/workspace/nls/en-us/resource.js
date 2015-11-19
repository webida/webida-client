define({
    notifyCannotCopyOrMoveToParentDirectory: 'Cannot copy or move "${path}" to its parent directory',
    notifySourceFsidIsDifferentFromTheCurrentOne: 'Source fsid is different from the current one, ' +
    'which is currently not supported',
    notifyFailedToDelete: 'Failed to delete',
    notifyAllFilesHaveBeenDeletedSuccessfully: 'All files have been deleted successfully',
    notifyNoSuchFile: 'No such file "${path}" in the workspace',
    notifyErrorWhileExpandingTo: 'Error while expanding to "${path}": ${result}',
    notifyNoSuchFileInTheWorkspace: 'No such file ${selection} in the workspace',
    notifyErrorWhileExpandingToSelection: 'Error while expanding to "${selection}": ${result}',
    toolBarTooltipCollapseAll: 'Collapse All',
    toolBarTootipSyncWithEditor: 'Sync with Editor',
    toolBarTootipStopSync: 'Stop Sync',

    notifyDoneSuccessfully: '${cap} successfully',
    notifyAbortedByAnErrorTitle: '${cap} was aborted by an error',
    notifyAborted: '${cap} was aborted',
    notifyCannotActionToNonDirectory: 'Cannot ${action} to a non-directory "${path}"',
    notifyCannotActionDirectoryToItselfOrItsDescendant:
    'Cannot ${action} a directory "${path1}" to itself or to its descendant "${path2}"',
    notifyCannotUploadSomethingThatIsNeitherDirNorFile:
    'Cannot upload something that is neither a directory nor a file',
    notifyEnterAName: 'Enter a name.',
    notifySlashesAreNotAllowedInFileOrDirName:
    'Slashes are not allowed in a file or directory name.',
    notifyNewNameIsNotAllowedAsFileOrDirName:
    '"${newName}" is not allowed as a file or directory name.',
    notifyFileOrDirWithTheNameAlreadyExists:
    'A file or directory with the name "${newName}" already exists.',
    notifyFileOrDirCannotHaveTheNameExeeds255Bytes:
    'A file or directory cannot have the name "${newName}" whose byte-length exceeds 255.',
    notifyFileOrDirCannotHaveTheNameWithDisallowedCharacter:
    'A file or directory cannot have the name "${newName}" which contains a disallowed character.',
    notifyFailedToCreateFileOrDir: 'Failed to create a file or directory (${err})',
    notifySuccessfullyCreated: '\'${newName}\' successfully created',
    notifyFailedToRename: 'Failed to rename',
    notifyRenamedSuccessfully: 'Renamed successfully',
    printResultCannotOveriteWithSameName:
    'cannot overwrite a ${type1} "${id}" with a ${type2} of the same name',
    printResultCannotHandleSomethingNeitherDirNorFile:
    'cannot handle something that is neither a directory nor a file',

    askPolicyDialogTitleForFile: 'File Names Conflict',
    askPolicyDialogTitleForDir: 'Directory Names Conflict',
    askPolicyDialogMarkUpForFile : '<span>The target directory "${targetPath}" ' +
    'already has a file "${name}". </span>',
    askPolicyDialogMarkUpForDir : '<span>The target directory "${targetPath}" ' +
    'already has a subdirectory "${name}". </span>',
    askPolicyDialogSkip: 'Skip',
    askPolicyDialogSkipAll: 'Skip All',
    askPolicyDialogOverwrite: 'Overwrite',
    askPolicyDialogOverwriteAll: 'Overwrite All',
    askPolicyDialogMerge: 'Merge',
    askPolicyDialogMergeAll: 'Merge All',
    askPolicyDialogRename: 'Rename',
    askPolicyDialogRenameAll: 'Rename All',
    askPolicyDialogAbort: 'Abort',

    creationDialogCreate: 'Create',
    creationDialogCancel: 'Cancel',
    creationDialogTitleForFile: 'New File',
    creationDialogTitleForDir: 'New Directory',
    creationDialogInstructionLabel: 'Enter the name of a new ${kind}.',

    preferenceGroupFilter: 'Filter',
    preferenceItemFilterResources: 'Filter .* resources',
    preferenceItemFilterProjectAndWorkspaceDirectories: 'Filter .project and .workspace directories'
});
