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

/**
 * @module msg
 * @fileoverview msg - messaging library
 *
 * @version: 0.1.0
 * @since: 2014.07.17
 *
 */



/**
* messaging api for Javascript module.
*
* This module provides JavaScript API's for message service.
* It depends on socket.io in external/socket.io-client/
* @module msg
*/
define([
	'webida-lib/server-api',
	'external/socket.io-client/socket.io',
	'webida-lib/util/logger/logger-client'
], function (
	webida, 
	sio,
	Logger
) {
    'use strict';

	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	logger.off();

    /**
     * user information
     * @property {string} nick - display name
     * @property {string} email - user's email
     * @property {string} uid - user's unique id
     * @property {string} token - user's access token
     * @typedef {object} User
     * @memberOf module:msg
     */

    var User = function (nick, email, uid, token) {
        this.nick = nick;
        this.email = email;
        this.uid = uid;
        this.token = token;
    };

    var Conn = function (user, host, msgMap) {
        var self = this;
        this.user = user;
        this.msgMap = msgMap;
        this.sock = sio.connect(host);
        this.sock.off = this.sock.removeListener;

        this.on = function (name, func) {
            self.sock.off(name);
            self.sock.on(name, func.bind(null, self));
        };

        this.off = function (name) {
            self.sock.off(name);
        };

        function registerMsgMap(arrMap, cli, sock) {
            for (var i = 0; i < arrMap.length; i++) {
                sock.on(arrMap[i].name, arrMap[i].func.bind(
                    null, cli));
            }
        }

        if (msgMap) {
            registerMsgMap(msgMap, self, self.sock);
        }

        this.sock.on('connect', function () {
            logger.log('connected to the notify-server');
        });

        this.sock.on('disconnect', function () {
            logger.log('disconnected');
            //topicMgr.publish(topics.logout);
        });

        this.disconnect = function () {
            self.sock.disconnect();
            logger.log('try disconnecting...');
        };

        this.sendMsg = function (type, msg) {
            self.sock.emit(type, msg);
        };
    };

    var HashMap = function () {
        this.map = new Array([]);
    };

    HashMap.prototype = {
        put: function (key, value) {
            this.map[key] = value;
        },
        get: function (key) {
            return this.map[key];
        },
        getAll: function () {
            return this.map;
        },
        clear: function () {
            this.map = new Array([]);
        },
        getKeys: function () {
            var keys = new Array([]);
            Object.keys(this.map).forEach(function (i) {
                keys.push(i);
            });
            return keys;
        },
        remove: function (key) {
            delete this.map[key];
        }
    };

    var connMap = new HashMap();

    var TaskMgr = function () {
        var taskMap = new HashMap();
        this.pushTask = function (cb) {
            var taskid = guid();
            taskMap.put(taskid, cb);
            return taskid;
        };

        this.popTask = function (id, err, msg) {
            var func = taskMap.get(id);
            if (func) {
                func(err, msg);
            }
            taskMap.remove(id);
        };
    };

    var taskMgr = new TaskMgr();

    /**
     * In order to receive messages, you need to define callback functons as follow
     * @property {usermsg_callback} usermsg - callback functon that you want to receive from other users
     * @property {topicsysnotify_callback} topicsysnotify
     - callback functon that you want to receive system notification on topics
     * @property {topicusernotify_callback} topicusernotify
     - callback functon that you want to receive user notification on topics
     * @typedef {object} options
     * @memberOf module:msg
     */

    var options = null;
    var loginCallback;

    /* jshint camelcase: false */
    function msg_Ready(conn, msg) {
        logger.log('ready - ' + JSON.stringify(msg));
        conn.sendMsg('auth', conn.user);
    }

    function msg_authAns(conn, msg) {
        logger.log('authAns - ' + JSON.stringify(msg));
        if (loginCallback) {
            if (msg.errcode.code === 0) {
                loginCallback(null, msg.data);
            }
            else {
                loginCallback(new Error(msg.errcode.msg));
            }
        }
    }

    function msg_subAns(conn, msg) {
        logger.log('subAns - ' + JSON.stringify(msg));
        var err = (msg.errcode.code === 0) ? null : new Error(msg.errcode.msg);
        taskMgr.popTask(msg.data.taskid, err, msg.data);
    }

    function msg_pubAns(conn, msg) {
        logger.log('pubAns - ' + JSON.stringify(msg));
        var err = (msg.errcode.code === 0) ? null : new Error(msg.errcode.msg);
        taskMgr.popTask(msg.data.taskid, err, msg.data);
    }

    function msg_topicUserNtf(conn, msg) {
        logger.log('user ntf - ' + JSON.stringify(msg));

        if (!msg.data.topic) {
            console.error('invalid topic:' + JSON.stringify(msg));
            return;
        }
        if (options && options.topicusernotify) {
            var xx = options.topicusernotify.bind(options);
            xx(msg.from, msg.data.topic, msg.data);
        }
    }

    function msg_topicSysNtf(conn, msg) {

        logger.log('system ntf - ' + JSON.stringify(msg));

        if (!msg.data.topic) {
            console.error('invalid topic:' + JSON.stringify(msg));
            return;
        }

        if (options && options.topicsysnotify) {
            var xx = options.topicsysnotify.bind(options);
            xx(msg.data.topic, msg.data.data);
        }
    }

    function msg_userMsg(conn, msg) {
        logger.log('user msg - - ' + JSON.stringify(msg));

        if (options && options.usermsg) {
            var xx = options.usermsg.bind(options);
            xx(msg.from, msg.data);
        }

    }

    var msgMap = [
        { name: 'ready', func: msg_Ready },
        { name: 'authAns', func: msg_authAns },
        { name: 'subAns', func: msg_subAns },
        { name: 'pubAns', func: msg_pubAns },
        { name: 'userNtf', func: msg_topicUserNtf },
        { name: 'sysNtf', func: msg_topicSysNtf },
        { name: 'userMsg', func: msg_userMsg }
    ];
    /* jshint camelcase: true */

    var guid = (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    })();




    /**
     * Callback function. If function finished successfully then error is undefined
     *
     * @callback init_callback
     * @param {module:msg.callback_error} error - Error message. Error message is string or undefined
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @memberOf module:msg
     */


    /**
     * subscription info. for a topic
     * @property {string} topic - topic name
     * @typedef {object} subinfo
     * @memberOf module:msg
     */

    /**
     * subscriptions info. for topics
     * @property {Array} topics - topic name array
     * @typedef {object} subinfo2
     * @memberOf module:msg
     */


    /**
     * publication info. for topic
     * @property {string} topic - topic name
     * @property {string} msg - publication message
     * @typedef {object} pubinfo
     * @memberOf module:msg
     */


    /**
     * Callback function. If function finished successfully then error is undefined
     *
     * @callback sub_callback
     * @param {module:msg.callback_error} error - Error message. Error message is string or undefined
     * @param {module:msg.subinfo} subinfo - subscription info
     * @memberOf module:msg
     */

    /**
     * Callback function. If function finished successfully then error is undefined
     *
     * @callback sub2_callback
     * @param {module:msg.callback_error} error - Error message. Error message is string or undefined
     * @param {module:msg.subinfo2} subinfo2 - subscriptions info
     * @memberOf module:msg
     */


    /**
     * Callback function. If function finished successfully then error is undefined
     *
     * @callback pub_callback
     * @param {module:msg.callback_error} error - Error message. Error message is string or undefined
     * @param {module:msg.pubinfo} pubinfo - subscription info
     * @memberOf module:msg
     */


    /**
     *
     * init: login onto connectoin server
     *
     * @method init
     * @param {string} uid - user's unique id
     * @param {string} token - user's access token.
     * @param {string} host - The host name of connection server
     * @param {module:msg.options} options - callback functions to receive notificatons
     * @param {init_callback} callback - callback(err, user)
     * @memberOf module:msg
     */
    var init = function (uid, token, host, option, cb) {
        var user  = new User('nick', 'email', uid, token);
        options = option;
        var conn = new Conn(user, host, msgMap);
        connMap.put(user.uid, conn);
        loginCallback = cb;
    };

    /**
     *
     * sub: subscribes specific topic, if you want to listen on specific topic
     *
     * @method sub
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {string} topic - topic means notification channel.
     * @param {module:msg.sub_callback} callback - callback(err, subInfo)
     * @memberOf module:msg
     */
    var sub = function (user, topic, cb) {
        var taskId = taskMgr.pushTask(cb);

        var subInfo = {
            'topic': topic,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }

        conn.sendMsg('sub', subInfo);
        return true;
    };

    /**
     *
     * sub2: subscribes several topics you want to listen notifications of the topic.
     *
     * @method sub2
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {Array} topic list - topic list includes several topic strings.
     * @param {module:msg.sub2_callback} callback - callback(err, subInfo)
     * @memberOf module:msg
     */
    var sub2 = function (user, topics, cb) {
        var taskId = taskMgr.pushTask(cb);
        var subInfo = {
            'topiclist': topics,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }

        conn.sendMsg('sub2', subInfo);

        return true;
    };


    /**
     *
     * unsub: unsubscribes topic.
     *
     * @method unsub
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {string} topic - topic.
     * @param {module:msg.sub_callback} callback - callback(err, subInfo)
     * @memberOf module:msg
     */

    var unsub = function (user, topic, cb) {
        var taskId = taskMgr.pushTask(cb);
        var subInfo = {
            'topic': topic,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }

        conn.sendMsg('unsub', subInfo);
        return true;

    };


    /**
     *
     * unsub2: unsubscribes topic.
     *
     * @method unsub2
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {Array} topic array - topic.
     * @param {module:msg.sub2_callback} callback - callback(err, subInfo)
     * @memberOf module:msg
     */


    var unsub2 = function (user, topics, cb) {
        var taskId = taskMgr.pushTask(cb);
        var subInfo = {
            'topiclist': topics,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }
        conn.sendMsg('unsub2', subInfo);
        return true;
    };


    /**
     *
     * pub: publish message into the topic.
     *
     * @method pub
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {string} topic - The name of topic where you want to send message.
     * @param {string} msg - A message to deliver into the topic.
     * @param {module:msg.pub_callback} callback - callback(err, pubInfo)
     * @memberOf module:msg
     */

    var pub = function (user, topic, msg, cb) {
        var taskId = taskMgr.pushTask(cb);
        var pubInfo = {
            'topic': topic,
            'data': msg,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }
        conn.sendMsg('pub', pubInfo);
        return true;
    };


    /**
     *
     * pubToUsers: publish message to users in specific topic.
     *
     * @method pubToUsers
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {Array} arrUsers - The name of topic where you want to send message.
     * @param {string} topic - topic name
     * @param {string} msg - message for each topic.
     * @param {module:msg.pubtousers_callback} callback - callback(err, subInfo)
     * @memberOf module:msg
     */

    var pubToUsers = function (user, arrUsers, topic, msg, cb) {
        var taskId = taskMgr.pushTask(cb);
        var pubInfo = {
            'topic': topic,
            'data': msg,
            'arrUsers': arrUsers,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }
        conn.sendMsg('pubtousers', pubInfo);
        return true;
    };


    /**
     *
     * sendToUser: send message to user
     *
     * @method sendToUser
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {Array} targetUser - target user
     * @param {string} msg - message to send to user.
     * @param {sendtouser_callback} callback - callback(err, msg)
     * @memberOf module:msg
     */

    var sendToUser = function (user, targetUser, msg, cb) {
        var taskId = taskMgr.pushTask(cb);
        var msgInfo = {
            'targetUser': targetUser,
            'msg': msg,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }

        conn.sendMsg('sendtouser', msgInfo);
        return true;
    };

    /**
     *
     * sendToUsers: send message to users
     *
     * @method sendToUsers
     * @param {module:msg.User} user - user info. consist of email, displayname and accessToken.
     * @param {Array} targetUsers - target user's uid array
     * @param {string} msg - message to send to user.
     * @param {sendtousers_callback} callback - callback(err, msg)
     * @memberOf module:msg
     */

    var sendToUsers = function (user, targetUsers, msg, cb) {
        var taskId = taskMgr.pushTask(cb);
        var msgInfo = {
            'targetUsers': targetUsers,
            'msg': msg,
            'taskid': taskId
        };
        var conn = connMap.get(user.uid);
        if (!conn) {
            return false;
        }
        conn.sendMsg('sendtousers', msgInfo);
        return true;
    };

    return {
        init: init,
        sub: sub,
        sub2: sub2,
        unsub: unsub,
        unsub2: unsub2,
        pub: pub,
        pubToUsers: pubToUsers,
        sendToUser: sendToUser,
        sendToUsers: sendToUsers
    };
});
