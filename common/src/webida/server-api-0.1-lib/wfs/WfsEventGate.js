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
 * @file WfsEventGate.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    '../common',
    './WfsEventHolder',
    './WfsStats',
    './wfs-utils'
], function (
    common,
    WfsEventHolder,
    WfsStats, 
    wfsUtils
) {
    'use strict';

    // provides subset of legacy FileSystem object
    // some methods are not supported, completely
    // we should create better interface in next api 0.2 with cleaner spec and Promise
    
    var logger = common.logger;
    var POLLING_THRESHOLD = 2;
    var POLLING_PERIOD = 100;

    function WfsEventGate(session, wfsId) {
        this.wfsId = wfsId;
        this.session = session;
        this.masks = {};  // when masked /a/b, /a/b and /a/b/* will be masked
        this.holders = {}; // path -> mutating event

        this.pollTimer = null;
        this.eventSequence = 0;
        this._pollEventsBound = this._pollEvents.bind(this);
        this._onWatcherEventBound = this._onWatcherEvent.bind(this);

        session.on('wfsRaw', this._onWatcherEventBound);
    }

    WfsEventGate.prototype = {

        stopListening: function stopListening() {
            if (this.session) {
                this.session.off('wfsRaw', this._onWatcherEventBound);
                logger.debug('stopped listening event on wfs ' + this.wfsId);
            }
        },

        // When WfsMount calls some server api, it calls maskEvents() to hold events from server
        //  on api target(src/dst) paths, masking events on the path and it's descendants.
        //  (e.g. masking '/a/b' will mask events from /a/b and /a/b/**/*)

        // Masking will fais if given path is already holded by some holder. That means, some
        // API call is not completed on the path, or server has some command (build, git works...)
        // on the path. If masking failes, WfsMount should not proceed api call and invoke
        // failure callback with proper message.

        maskEvents: function maskEvents(path, apiName) {
            var holder = this.holders[path];
            if (holder) {
                if (holder.maskedBy) {
                    throw new Error(path + ' is locked by other api call ' + holder.maskedBy);
                } else {
                    throw new Error(path + ' is locked by other processes in server');
                }
            }
            // If there's no holder but a mask exists - events are not arrived for the path.
            // If we omit checking, api may call unmask() twice with 'different' policies,
            //  and users will see somewhat weird things, maybe.
            var mask = this.masks[path];
            if (mask) {
                throw new Error(path + 'is locked by other api call ' + mask.apiName);
            } else {
                this.masks[path] = {
                    apiName : apiName,
                    holders: []
                };
            }
        },

        // when unmasking, wfs api should pass unmasking policy
        // 1) call was successful, discard held events and api wil emit a virtual event'
        // 2) call was successful, flip event types to make them 'local, known changes'
        //    (flipping will prefix '_' at every normal held event)
        // 3) call was unsuccessful. emit all held events as 'remote, unknown changes'
        //    (without flipping, every held event will be emitted as it is)

        unmaskEvents: function unmaskEvents(path, succeeded, discardEventsFromHolders) {
            var mask = this.masks[path];
            var myself = this;
            if (!succeeded) {
                discardEventsFromHolders = false; 
            }
            if (mask) {
                var unhold = function unhold() {
                    mask.holders.forEach(function(holder) {
                        holder.unmask(succeeded, discardEventsFromHolders);
                    });
                    delete myself.masks[path];
                };
                // if we have no holders in the mask object yet, that means 
                //  api calls unmask too fast, while no events has been arrived yet.
                if (!this.holders[path]) {
                    logger.debug('postponed unmasking for final events has arrived yet');
                    setTimeout(unhold, POLLING_PERIOD);
                } else {
                    unhold();
                }
            }
        },

        _findMask: function _isMasked(path) {
            var ancestors = wfsUtils.getAncestors(path, { includeSelf:true } );
            var myself = this;
            var mask = null;
            ancestors.some(function(ancestorPath) {
                mask = myself.masks[ancestorPath];
                return mask ? true : false;
            });
            return mask;
        },

        _addNewHolder : function _addNewHolder(path) {
            var mask = this._findMask(path);
            var holder = null;
            if (mask) {
                holder = new WfsEventHolder(this.wfsId, path, mask.apiName);
                mask.holders.push(holder);
            } else {
                holder = new WfsEventHolder(this.wfsId, path);
            }
            this.holders[path] = holder;
            return holder;
        },

        _onWatcherEvent : function _onWatcherEvent(wfsId, type, path, stats) {
            if (wfsId !== this.wfsId) {
                return;
            }
            var holder = this.holders[path];
            if (!holder) {
                holder = this._addNewHolder(path);
            }
            // all sequence numbers from getWfsEvents() has positive number, excluding 0.
            this.eventSequence++; 
            holder.holdServerEvent(type, stats, this.eventSequence);
            if (!this.pollTimer) {
                this.eventSequence = 0;
                this.pollTimer = setInterval(this._pollEventsBound, POLLING_PERIOD);
            }
        },

        _fireEvents: function _fireEvents(events,startedAt) {
            var myself = this; 
            events.forEach(function(event) {
                var wstats = event.stats ? new WfsStats(event.stats) : undefined;
                //logger.debug('fire wfs event', event);
                myself.session.emit('wfs', myself.wfsId, event.type, event.path, wstats);
            });
            var elapsedTime = new Date().getTime() - startedAt;
            if (elapsedTime >= POLLING_PERIOD) {
                // TODO: make polling interval & threshold adaptive, if possible
                logger.warn('polling takes too long time ', {
                    polled: events.length,
                    elapsedTime: elapsedTime
                });
            }
        },

        _pollEvents : function _pollEvents() {
            var startedAt = new Date().getTime();
            var events = [];
            var myself = this; 
            var allPaths = Object.keys(this.holders);

            allPaths.forEach(function(path) {
                var holder = myself.holders[path];
                if (holder.poll(POLLING_THRESHOLD)) {
                    // when a holder has some missing events, all events held by the holder
                    // will not be emitted for app should reload stats of the path manually
                    // refreshing can be done anytime, but sequence will be set to 0,
                    // to refresh needed stats as soon as possible.
                    // Currently, the value of missingEventsBefore is not used but if we
                    // changes policy on missing events the number will be quite useful.
                    if (holder.missingEventsBefore) {
                        events.push({
                            path: holder.path,
                            type: '__refresh',
                            sequence : 0
                        });
                    } else {
                        holder.getWfsEvents().forEach(function (event) {
                            events.push(event);
                        });
                    }
                    delete myself.holders[holder.path];
                } 
            });

            if (events.length > 0 ) {
                events.sort( function(ev1, ev2) {
                    return ev1.sequence - ev2.sequence;
                });
                this._fireEvents(events, startedAt);
            }

            if (allPaths.length <= 0) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
        }
    };


    return WfsEventGate;
});