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

var root = null;
var defaultDir = 'Download';
var media = null;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log('deviceready');
    if (media !== null)
        media.release();
}

// Get the file system
function getFileSystem() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function (fileSystem) {
            root = fileSystem.root;
            console.log('fileSystem: ' + root.toURL());
            listDownloadDir(root);
        }, function (err) {
            console.error('Failed to get a file system: ' + err.code);
        }
    );
}

function listDownloadDir(directoryEntry) {
    if (!directoryEntry.isDirectory)
        return;

    var dirReader = directoryEntry.createReader();
    dirReader.readEntries(
        function (entries) {
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (defaultDir === entry.name) {
                    console.log('Reading \'' + defaultDir + '\' directory...');
                    var downloadReader = entry.createReader();
                    downloadReader.readEntries(
                        appendDownloadFiles,
                        function (err) {
                            console.error('Failed to read \'Download\' entries: ' + err.code);
                        }
                    );
                    break;
                }
            }
        }, function (err) {
            console.error('Failed to read entries: ' + err.code);
        }
    );
}

function listFiles() {
    getFileSystem();
}

function appendDownloadFiles(entries) {
    var dirContent = $('#dirContent');
    dirContent.empty();
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isFile && /.mp3$/.test(entry.name)) {
            console.debug('Found mp3 file: ' + entry.name);
            dirContent.append('<a href="javascript:void(0);" class="list-group-item" onClick="playFile(this)">' + entry.name + '</a>');
        }
    }
}

function stop() {
    console.log('Stopping media...');
    if (media !== null) {
        media.stop();
        media.release();
    }
}

function playFile(elem) {
    var file = $(elem).text();
    console.log('Playing a file \'' + file + '\'...');
    media = new Media(defaultDir + '/' + file,
        function () { console.log("playAudio():Audio Success"); },
        function (err) { console.error("playAudio():Audio Error: " + err.code); }
    );
    media.play();
}

function vibrate() {
    console.log('vibrate');
    // Vibrate for 3 seconds
    navigator.notification.vibrate(3000);
}


function getPhoto() {
    console.log('getPhoto');
    navigator.camera.getPicture(onCameraSuccess, onFail, {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    });
}

function onCameraSuccess(imageData) {
    var div = document.getElementById('img1');
    var $img = $('<img>');
    $img.attr('src', 'data:image/jpeg;base64,' + imageData);
    $img.width('200px');
    $(div).empty().append($img);
}

function onFail(message) {
    console.error('Failed because: ' + message);
}
