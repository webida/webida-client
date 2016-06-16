'use strict';

define([
    './common',
    './WfsMount'
], function (
    common,
    WfsMount
) {

    var privates = {
        mounts : {}
    };

    // To support multiple file systems in single workspace
    //  1) we need a way to set access token for each file system mounted
    //  2) server should provide a way to get an access token for each file system
    // But, don't make things too hard. 
    //   "1 ws == 1 fs" policy looks stupid but simple and clean for IDE application

    // In the view point of resource abstraction
    //  every workspace items in workspace plugin may have some URI
    //  and this API supports only wfs:// URI
    // If some application wants to implement its own workspace persistence,
    //  then the application can decide to implement multiple data source provider or not.
    //  IDE currently does not need more than 1 FS.

    function mountByFSID(fsid) {
        if (!privates.mounts[fsid]) {
            privates.mounts[fsid] = new WfsMount(fsid);
        }
        return privates.mounts[fsid];
    }
    
    return {
        mountByFSID : mountByFSID
    };
    
});