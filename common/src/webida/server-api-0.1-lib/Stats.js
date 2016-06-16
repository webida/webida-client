"use strict"

define([ ], function() {

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
        
    };

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