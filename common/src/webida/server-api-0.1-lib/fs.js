/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file fs.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    './common',
    './WfsMount'
], function (
    common,
    WfsMount
) {
    'use strict';

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