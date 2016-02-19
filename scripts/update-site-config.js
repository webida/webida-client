/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
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

// This file is actually a part of build/ci system, not belong to webida client
// Copy this file in your jenkins server and run with node.js in build job
// to fix site-config.json with proper build information.

// This file requires node 4.x or greater
//  run node update-site-config.js $BUILD_NUMBER $COMMIT_ID

// ignore all file contents running jshint
/* jshint ignore:start */

"use strict";

var path=require('path');
var fs=require('fs');

var topDir = path.resolve(__dirname + '/..');
var configPath = topDir +'/site-config.json';

console.log("loading site-config.json file from " + configPath);
var config = require(configPath);
var version = require(topDir+'/package.json').version;

var commitId = process.argv[2] || '';
var buildNumber = process.argv[3] || 0;
var buildTime = new Date().toISOString();

config.build = {
    version:version,
    buildNumber:buildNumber,
    buildTime:buildTime,
    commitId:commitId
};

var text = JSON.stringify(config, null, 2);
console.log("new site-config.json = " + text);
fs.writeFile(configPath, text, function(err) {
    if(err) {
        console.error("Error while saving site-config.json", err);
        throw err;
    } else {
        console.log("saved new site-config.json");
        process.exit(0);
    }
});

/* jshint ignore:end */