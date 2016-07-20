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
 * @file WfsEventHolder.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    '../common'
], function(
    common
) {
    'use strict';

    var logger = common.logger;

    function WfsEventHolder(wfsId, path, maskedBy) {
        this.events = [];
        this.path = path;
        this.wfsId = wfsId;

        this.discardEvents = false; 
        this.shouldFlipEventType = false;
        this.maskedBy = maskedBy;
        this.missingEventsBefore = 0;
        this.pollCounter = 0;
    }

    // while stabilizing or masked
    WfsEventHolder.prototype = {

        get latest() {
            if (this.events.length > 0) {
                return this.events[this.events.length-1];
            } else {
                return null;
            }
        },

        // returns true when this holder is 'stable' enough to fire events
        // if poll returns true, gateway should fire events and remove holder
        // when holder works under mask, (this.maskedBy is truthy) 
        //  poll() will not work until this holder is freed by unmask() method. 
        poll: function pollToFireEvent(threshold) {
            if (!this.maskedBy) {
                this.pollCounter++;
                if (this.pollCounter >= threshold) {
                    this.pollCounter = -9999; // to make enough time before being polled again. 
                    return true;
                }
            }
            return false;
        },

        // when path is 'unmasked' then this holder should become 'pollable'
        unmask: function unmask(shouldFlipEventType, discardEvents) {
            if (this.maskedBy) {
                this.discardEvents = discardEvents;
                this.shouldFlipEventType = shouldFlipEventType;
                this.maskedBy = false;
            }
        }, 

        getWfsEvents : function getWfsEvents() {
            var myself = this;
            if (this.discardEvents) {
                return [];                 
            } else {
                return this.events.map( function(event) {
                    return {
                        path: myself.path,
                        type: myself.shouldFlipEventType ? '_' + event.type : event.type,
                        stats: event.stats,
                        sequence : event.sequence
                    };
                });
            }
        },

        holdServerEvent : function(newType, newStats, sequence) {
            var latest = this.latest;
            var current = {
                type : newType,
                stats : newStats,
                sequence : sequence
            };

            if (!latest) {
                this.events.push(current);
                return;
            }

            // If we miss some events from server (due to connection problem)
            //   then events will be messed up (e.g. addDir->unlink->change->unlinkDir ..)
            // Guessing what happened in 'the blank of history' is NOT SAFE
            //   and will make more complicated problems, probably.
            // So, in that case, holder produces final wfs events '_refresh' only
            //   to force app to refresh the stats of path, manually.

            switch(latest.type) {
                case 'addDir':
                    this._holdAfterAddDir(latest, current);
                    break;
                case 'unlinkDir':
                    this._holdAfterUnlinkDir(latest, current);
                    break;
                case 'add':
                    this._holdAfterAdd(latest, current);
                    break;
                case 'change':
                    this._holdAfterChange(latest, current);
                    break;
                case 'unlink':
                    this._holdAfterUnlink(latest, current);
                    break;
                default:
                    logger.error('unknown event type detected on ' + this.path, latest);
                    break;
            }
            this.pollCounter = 0;
        },

        _holdAfterAddDir: function _holdAfterAddDir(latest, current) {
            switch(current.type) {
                case 'unlinkDir':
                    // there has been a 'very short lived' directory
                    this.events.pop();
                    break;
                case 'addDir':
                case 'add':
                case 'change':
                case 'unlink':
                    this._markMissingEvents(latest, current);
                    this.events.push(current);
                    break;
                default:
                    logger.error('new event has invalid type', current);
                    break; //
            }
        },

        _holdAfterUnlinkDir: function _holdAfterUnlinkDir(latest, current){
            switch(current.type) {
                case 'add': // a dir is removed and a file replaced that path. very normal.
                case 'addDir':
                    // if we discard this event as we do in addDir event, new stats of addedDir
                    // cannot be set to upper layer. Guess what happens if we have events,
                    // addDir1 -> unlinkDir -> addDir2 : addDir2 remains with new stats
                    // unlinkDir1 -> addDir -> unlinkDir2 : unlinkDir 1 remains, without stats. OK.  
                    this.events.push(current);
                    break;
                case 'unlinkDir': // maybe missing addDir
                case 'change':    // maybe missing add
                case 'unlink':    // maybe missing add and some changes
                    this._markMissingEvents(latest, current);
                    this.events.push(current);
                    break;
                default:
                    logger.error('new event has invalid type', current);
                    break; //
            }
        },

        _holdAfterAdd: function _holdAfterAdd(latest, current) {
            switch(current.type) {
                case 'change':
                    // when a file is added and changed, then it means is still 'writing' contents.
                    // in that case, we preserve previous add event, replacing stats only
                    latest.stats = current.stats;
                    break;
                case 'unlink': // file is added and removed. same as handling unlinkDir after addDir
                    this.events.pop();
                    break;
                case 'add': // maybe missing unlink
                case 'addDir':  // maybe missing unlink
                case 'unlinkDir': // maybe missing unlink and addDir
                    this._markMissingEvents(latest, current);
                    this.events.push(current);
                    break;
                default:
                    logger.error('new event has invalid type', current);
                    break; //
            }
        },

        _holdAfterChange: function _holdAfterChange(latest, current) {
            switch(current.type) {
                case 'change':
                    // it's still writing.
                    latest.stats = current.stats;
                    break;
                case 'unlink':
                    // no need to keep 'changing' history - we have 2 possible cases
                    //  1) add -> change -> unlink ==> discard all
                    //  2) change -> unlink ==> unlink remains.
                    //  case 1 does not happens for _holdAfterAdd merges 'change' event into add.
                    this.events.pop();
                    this.events.push(current);
                    break;
                case 'add': // maybe missing unlink
                case 'addDir':  // maybe missing unlink
                case 'unlinkDir': // maybe missing unlink and addDir
                    this._markMissingEvents(latest, current);
                    this.events.push(current);
                    break;
                default:
                    logger.error('new event has invalid type', current);
                    break; //
            }
        },

        _holdAfterUnlink: function _holdAfterUnlink(latest, current) {
            switch(current.type) {
                case 'add':
                    // it's usually 'atomic writing'
                    latest.type = 'change';
                    latest.stats = current.stats;
                    // if server is creating a new directory and write a file atomically
                    // then this 'chage' event should be fired after creating the directory.
                    // if we don't change sequence number, such natural order might be broken.
                    latest.sequence = current.sequence;
                    break;
                case 'addDir':  // very normal. just removed a file and replaced to a dir.
                    this.events.push(current);
                    break;
                case 'change': // maybe missing 'add'
                case 'unlink': // maybe missing 'add'
                case 'unlinkDir': // maybe missing 'addDir'
                    this._markMissingEvents(latest, current);
                    this.events.push(current);
                    break;
                default:
                    logger.error('new event has invalid type', current);
                    break; //
            }
        },

        _markMissingEvents : function(latest, current) {
            logger.warn(this.path + ' has lost some events between latest and current event',
                latest, current );
            if (!this.missingEventsBefore) {
                this.missingEventsBefore = current.sequence;
            }
        }
    };
    
    return WfsEventHolder;
});