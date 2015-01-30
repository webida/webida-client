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
    'dijit/layout/TabContainer', // TabContainer
    'dijit/layout/ContentPane', // ContentPane
    'dojo/store/Memory',
    'dojo/domReady!'
], function (pm, parser, reg, TabContainer, ContentPane, Memory) {
    'use strict';
    //var container = null;
    //var cbWorkbench = null;

    function showSelectPaas(combo, container) {
        var name = combo.get('value');
        var store = combo.get('store');
        var paas = store.get('paas-store' + name);
        container.selectChild(paas.paas);
        
        var logo = paas.logo;
        document.getElementById('paas-logo-image').style.backgroundImage = 'url("' + logo + '")';
        
        //FIXME : logo set
    }

    function cbGetTab(tab) {
        var container = reg.byId('paas-stack-container');
        if (!container) {
            return;
        }
        container.addChild(tab);
        
        var combo = reg.byId('paas-selet-combo');
        var store = combo.get('store');
        var title = tab.get('title');
        var logo = tab.get('logo');
        if (!store) {
            dojo.connect(combo, 'onChange', function () {
                showSelectPaas(combo, container);
                console.log('change');
            });
            store = new Memory({
                data: [
                    {name: title, paas: tab, id: 'paas-store' + title, logo: logo}
                ]
            });
            combo.set('store', store);
            combo.set('value', title);
        } else if (store.data.length === 0) {
            dojo.connect(combo, 'onChange', function () {
                showSelectPaas(combo, container);
                console.log('change');
            });

            store.put({name: title, paas: tab, id: 'paas-store' + title, logo: logo});
            combo.set('value', title);
        } else {
            store.put({name: title, paas: tab, id: 'paas-store' + title, logo: logo});
        }
    }



    var paas = {
        initPaaSTab: function () {
            var exts = pm.getExtensions('paas:tab');
            exts.forEach(function (ext) {
                require([ext.module], function (module) {
                    module[ext.getTab](cbGetTab);
                });
            });

        },
        // for workbench:views extension point
        onStart: function () {
            this.initPaaSTab();
            //tab.init();
            //cb(container);

            //return container;
        }

        // for workbench:views extension point
        //onViewAppended: function () {},

    };

    return paas;
});