/**
 * Created by lunaris on 2016-05-23.
 */

define([
    './common',
    './FileSystem'
],  function (
    common,
    FileSystem
) {
    "use strict";
    var publics = {

    };
    var privates = {
        mounts : {}
    };



    function mountByFSID() {

    }

    return {
        mountByFSID : mountFileSystemById,
        FileSystem : FileSystem
    };
});