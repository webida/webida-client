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
 * @file Stats.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([ ], function() {
    'use strict';

    function Stats (serverStats, path, name) {
        this.path = path; 
        this.name = name || this.path.split('/').pop(); 

        // all other properties are inherited from server stats object 
        this.size = serverStats.size;
        this.mtime = serverStats.mtime;
        this.birthtime = serverStats.birthtime;
        this.mode = serverStats.mode;
        this.nlink = serverStats.nlink;
        this.type = serverStats.type; 
        
    }

    Stats.prorotype = {
        get isFile() { return (this.type !== 'DIRECTORY'); },
        get isDirectory() { return (this.type === 'DIRECTORY'); },
        get isBlockDevice() { return (this.type === 'BLOCK_DEVICE'); },
        get isCharacterDevice() { return (this.type === 'CHARACTER_DEVICE'); },
        get isSymbolicLink() { return (this.type === 'LINK'); },
        get isFIFO() { return (this.type === 'FIFO'); },
        get isSocket() { return (this.type === 'SOCKET'); }
    };

    return Stats;
});