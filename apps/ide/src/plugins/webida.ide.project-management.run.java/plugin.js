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

define([
        'webida-lib/app',
        'text!./java-run-configuration.html',
        'dojo/topic',
        'dijit/form/Select',
        'dijit/registry'
    ],
    function (ide, template, topic, Select, registry) {
        'use strict';
        var FS = ide.getMount();
        var currentRunConf;
        var ui = {};

        function _setTemplate(runConf){
            currentRunConf = runConf;
            if(runConf){
                ui.$parent.append(template);
                ui.inputBoxNodes = ui.$parent.find('.rcw-content-table-inputbox-edit');
                ui.inputBoxNodes[0].value = runConf.name ? runConf.name : '';

                ide.getWorkspaceInfo(function(err, workspaceInfo){
                    if(!err) {
                        var projects = workspaceInfo.projects.map(function(project){
                            return {
                                value: project,
                                label: project
                            };
                        });
                        if(registry.byId('run-configuration-project')) {
                            registry.byId('run-configuration-project').destroyRecursive();
                        }
                        ui.select = new Select({ options: projects }, 'run-configuration-project');
                        ui.select.startup();
                        ui.select.set('value', runConf.project);
                    }
                });

                ui.saveButton = ui.$parent.find('.rcw-action-save');
                ui.saveButton.on('click', function(){
                    if(_doSave()) {
                        topic.publish('webida.ide.project-management.run:configuration.changed',
                            'save', currentRunConf);
                    }
                });
            }
        }

        function _doSave(){
            // validation on currentRunConf
            //currentRunConf.name = ui.inputBoxNodes[0].value;
            //currentRunConf.project = ui.select.get('value');
            return true;
        }

        return {
            run: function(runConf, callback) {
                console.log('Run As...', runConf);
                var rootPath = ide.getPath() + '/' + runConf.project;
                var filePath = runConf.srcDir + '/' + runConf.path.replace(/\./g, '/') + '.java';
                FS.exec(rootPath, {cmd: 'javac', args: ['-d', runConf.outputDir, filePath]},
                    function(err, stdout, stderr){
                        console.debug('###javac', runConf.path, stdout, stderr);
                        topic.publish('#REQUEST.log', stdout);
                        topic.publish('#REQUEST.log', stderr);
                    FS.exec(rootPath, {cmd: 'java', args: ['-cp', runConf.outputDir, runConf.path]},
                        function(err, stdout, stderr){
                            console.debug('###java', runConf.path, stdout, stderr);
                            topic.publish('#REQUEST.log', stdout);
                            topic.publish('#REQUEST.log', stderr);
                            callback(null, runConf);
                    });
                });
            },
            newConf: function($parent, runConf, callback){
                ui.$parent = $parent;
                _setTemplate(runConf);
                callback(null, runConf);
            },
            loadConf: function($parent, runConf, callback) {
                ui.$parent = $parent;
                _setTemplate(runConf);
                callback(null, runConf);
            },
            saveConf: function(runConf, callback) {
                // validation
                if(_doSave()) {
                    callback(null, runConf);
                } else {
                    callback('validation failed');
                }
            },
            deleteConf: function(runConfName, callback){
                callback(null, currentRunConf);
            }
        };
    });
