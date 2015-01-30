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

define(['plugin-manager', // pm
    'dojo/parser', // parser
    'dijit/registry', // reg
    'dijit/layout/ContentPane', // ContentPane
    'dojo/domReady!'
], function (pm, parser, reg, ContentPane) {
    'use strict';
    
    function account(tab, fAccount) {
        var pane = new ContentPane({
            style: 'width:100%; padding:0px'
        });
        if (fAccount(pane) !== false) {
            tab.addChild(pane);
        }
    }
    
    function showApps(tab, fShowApps) {
        var pane = new ContentPane({
            style: 'width:100%; background-color: white; padding:0px;' +
            'text-indent: 20px; line-height: 300%; font-weight:bold'
        });
        fShowApps(pane);
        tab.addChild(pane);
    }

    function createApp(tab, fCreate) {
        var pane = new ContentPane({
            style: 'position:relative; height:50px;background-color: #B6C0CA; ' +
            'min-width:590px; padding:0px; text-indent: 20px; line-height: 300%; ' +
            'font-family: "Nanum Gothic Coding", Verdana,Arial,sans-serif; font-weight:normal; ' +
            'font-size:12pt; color: #2C353C;',
            content: 'App Information'
        });

        fCreate(pane);
        tab.addChild(pane);
    }
    
    /*function changeProject(projectPath) {
        var exts = pm.getExtensions('paas-template:views');
            exts.forEach(function (ext) {
                require([ext.module], function (module) {
                    module[ext.changeProject](projectPath);
                });
            });   
    }*/

    var paas = {
        init: function (cb) {
            var exts = pm.getExtensions('paas-template:views');
            exts.forEach(function (ext) {
                require([ext.module], function (module) {
                    var tab = new ContentPane({
                        style: 'height:100%; width:100%; padding:0px',
                        title: ext.name,
                        logo: ext.logo
                    });
                    if (cb) {
                        cb(tab);

                        account(tab, module[ext.account]);
                        
                        createApp(tab, module[ext.createApp]);

                        showApps(tab, module[ext.showApps]);
                        
                       
                    }
                });
            });
        }
    };



    var paastemplate = {
        // for workbench:views extension point
        getTab: function (cb) {
            paas.init(cb);
        }/*,
        changeProject: function (projectPath){
            changeProject(projectPath);
        }*/
    };

    return paastemplate;
});
