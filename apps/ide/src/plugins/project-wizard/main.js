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
 * @fileoverview webida - project templete engine
 *
 * @version: 0.1.0
 * @since: 2013.09.30
 *
 * Src:
 *   plugins/project-wizard/main.js
 */
define(['webida-lib/webida-0.3',
        'webida-lib/app',
        'other-lib/toastr/toastr',
        'other-lib/underscore/lodash.min',
        'other-lib/pageDown/Markdown.Converter',
        'lib/image-slide/sly.wrapper',
        'dojo/aspect',
        'dojo/Deferred',
        'dojo/dom',
        'dojo/on',
        'dojo/ready',
        'dojo/store/Memory',
        'dojo/store/Observable',
        'dijit/Dialog',
        'dijit/layout/TabContainer',
        'dijit/layout/ContentPane',
        'dijit/registry',
        'dijit/Tree',
        'dijit/tree/ObjectStoreModel',
        './constants',
        './build/buildProfile',
        './lib/util',
        'dojo/topic'
       ],
function (webida, ide,
          toastr, _, Markdown, sly,
          aspect, Deferred, dom, on, ready, Memory, Observable,
          Dialog, TabContainer, ContentPane, reg, Tree, ObjectStoreModel,
          Constants, BuildProfile, Util, topic
         )
{
    'use strict';

    var PW_MSG = {
        ERROR : 'Error',
        FAIL : 'Fail',
        SUCCESS : 'Success',

        FS_GET_MY_INFO_FAILED : 'Failed to get file system info',
        FS_READ_FILE_FAILED : 'Failed to read a file',
        FS_WRITE_FILE_FAILED : 'Failed to write a file',
        FS_COPY_FILE_FAILED : 'Failed to copy a file',
        FS_CREATE_DIRECTORY_FAILED : 'Failed to create a directory',
        FS_JSON_PARSE_FAILED : 'Failed to parse a JSON file',
        FS_EXISTS_FAILED : 'Failed to check for file existence',

        PROJECT_CREATE_SUCCESS :  'Project \'{0}\' was successfully created',

        INPUT_VALIDATION_ERROR: 'Input Validation Error',
        TEMPLATE_NOT_SELECTED : 'Template is not selected',
        PROJECT_NAME_LONG : 'Project name is too long. Please enter less than 255 characters.',
        PROJECT_NAME_NOT_GIVEN : 'Project name was not given.',
        PROJECT_EXISTS : 'Project already exists.',
        PROJECT_NAME_SPECIAL : 'Characters usable for a project name are "a~z, A~Z, 0~9, -, _"',
        TEMPLATE_NOT_EXISTS : 'Template does not exist',
        TARGET_PATH_NOT_GIVEN : 'Target path was not given'
    };

    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function ($0, $1) {
            return args[$1] !== void 0 ? args[$1] : $0;
        });
    };

    var PW_INTERNAL_TEMPLATE_PATH = 'internal/default/basic';
    var TYPES_FILE = 'types.json';

    // currently hardcoded as (unique) FS of user id 'template'
    var srcFS = 'xkADkKcOW'; // pre-generated to template source

    var NATURE_ID = 'org.webida.mobile.MobileNature';

    var mountSrc;
    var destFS; // init dynamically (either by given param 'dst=...' or template-engine app user file system (defalut) )
    var mountDest;

    var targetPath;
    var templateTree;
    var templateList = {};

    function getInternalTemplatePath() {
        return PW_INTERNAL_TEMPLATE_PATH;
    }

    function compare(a, b) {
        if (a.name < b.name) {
            return -1;
        } else if (a.name > b.name) {
            return 1;
        } else {
            return 0;
        }
    }

    var categoryStore = new Observable(new Memory({
        data: [
            {id: 'root', name: 'root'}
        ],
        removeAll: function () {
            var children = this.getChildren({id: 'root'});
            var that = this;
            _.each(children, function (child) {
                that.remove(child.id);
            });
        },
        // getChildren() called from tree
        getChildren: function (object) {
            return this.query({parent: object.id}, {sort: compare});
        }
    }));
    var templateStore = new Observable(new Memory({
        data: [
            {id: 'root', name: 'root'}
        ],
        removeAll: function () {
            var children = this.getChildren({id: 'root'});
            var that = this;
            _.each(children, function (child) {
                if (child.id !== 'root') {
                    that.remove(child.id);
                }
            });
        },
        addAll: function (array) {
            var that = this;
            if (_.isArray(array)) {
                _.each(array, function (child) {
                    that.add(child);
                });
            }
        },
        getChildren: function (object) {
            return this.query({parent: object.id}, {sort: compare});
        }
    }));

    /**
     * Create webida project configuration file.
     *
     * @param {String} name - project name
     * @param {String} desc - project description
     * @param {String} type - project type
     * @param {String} path - project start path
     *
     * @returns {object} run configuration object
     */
    function createProjectConf(name, template, options) {
        var conf = {};

        conf.name = (name ? name : 'default');
        conf.description = '';

        var date = new Date().toLocaleString();
        conf.created = date;
        conf.lastmodified = date;

        /* jshint camelcase: false */
        conf.type = (template.app_class ? template.app_class : '');
        /* jshint camelcase: true */

        conf.uuid = Util.newuuid();

        conf.run = Util.createRunConfiguration(conf, template);

        // build profile ("build")
        var profile = BuildProfile.getDefaultProfile(name);
        profile.addPlugin(BuildProfile.PLUGIN.Camera.id);
        profile.addPlugin(BuildProfile.PLUGIN.FileSystem.id);
        profile.addPlugin(BuildProfile.PLUGIN.Media.id);
        profile.addPlugin(BuildProfile.PLUGIN.Vibration.id);

        conf.build = [profile];

        conf.natures = [];
        if (options && options.supportsCordova) {
            conf.natures.push(NATURE_ID);
        }

        return conf;
    }

    function initPreviewImage() {
        var $frame = $('#pw-previewFrame');
        if ($frame) {
            $frame.sly(false); // destroy old sly settingzs

            //var $wrap = $frame.parent();
            var options = {
                horizontal: 1,
                itemNav: 'centered',
                smart: 1,
                activateOn: 'click',
                mouseDragging: 1,
                touchDragging: 1,
                releaseSwing: 1,
                startAt: 0,
                scrollBar: $('#pw-previewImageScroll'),
                scrollBy: 1,
                speed: 300,
                elasticBounds: 1,
                easing: 'swing',
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1
            };
            $frame.sly(options);
            console.log('initPreviewImage', $frame.width());
        }
    }

    function initFileSystem() {
        // TODO: template source path, need to integrate with auth (currently using FS of userid "template")
        function initSrcFS() {
            //console.log('srcFS', srcFS);
            mountSrc = _mount(srcFS);
            initDestFS();
        }

        function initDestFS() {
            destFS = undefined;
            if (destFS) {
                mountDest = _mount(destFS);
            } else {
                webida.fs.getMyFSInfos(function (err, fsInfos) {
                    if (err || fsInfos.length === 0) {
                        toastr.error(PW_MSG.FS_GET_MY_INFO_FAILED, PW_MSG.ERROR);
                        return;
                    } else {
                        destFS = fsInfos[0].fsid;
                        mountDest = _mount(destFS);
                    }
                });
            }

            setTargetFSInfo();
        }

        function setTargetFSInfo() {
            var defaultTargetLocation = targetPath;
            $('#pw-projectTargetLocationIp').val(defaultTargetLocation);
            initTemplate();
        }

        initSrcFS();
    }

    /**
     * Create category and template models.
     */
    function createModels(types) {
        var cMDeferred = new Deferred();

        function createSubCategoryAndTemplateModel(parentPath, currentFiles, parentID) {
            var cSCATMDeferred = new Deferred();

            function _visit(parentPath, fileStat, pID) {
                var visitDeferred = new Deferred();

                if (fileStat.isDirectory) {
                    var fileStatPath = parentPath + '/' + fileStat.name;
                    var specPath = fileStatPath + '/' + 'spec.json';
                    mountSrc.exists(specPath, function (err, exists) {
                        if (exists) {
                            mountSrc.readFile(specPath, function (err, content) {
                                if (err) {
                                    toastr.error(PW_MSG.FS_READ_FILE_FAILED, PW_MSG.ERROR);
                                } else {
                                    try {
                                        var o = JSON.parse(content);
                                        o.path = fileStatPath;
                                        var node = {
                                            id: o.template_id, // jshint ignore:line
                                            name: o.title,
                                            type: 'T',
                                            template: o,
                                            parent: 'root'
                                        };
                                        if (!templateList[pID]) {
                                            templateList[pID] = [];
                                        }
                                        templateList[pID].push(node);
                                    } catch (e) {
                                        console.error('JSON parse error: ' + e.message);
                                    }
                                }
                                visitDeferred.resolve();
                            });
                        } else {
                            // sub category added
                            var id = pID + fileStat.name;
                            console.log('categoryStore.add', id);
                            categoryStore.add({
                                id: id,
                                name: fileStat.name,
                                type: 'NT',
                                parent: pID
                            });
                            mountSrc.list(fileStatPath, function (err, files) {
                                if (err) {
                                    console.log('Failed to list template directory: ', fileStatPath);
                                } else {
                                    var cnt = 0;
                                    var checksum = files.length;
                                    _.each(files, function (file) {
                                        _visit(fileStatPath, file, id).then(
                                            function () {
                                                if (checksum <= ++cnt) {
                                                    visitDeferred.resolve();
                                                }
                                            }
                                        );
                                    });
                                }
                            });
                        }
                    });
                } else {
                    console.warn('Template directory conformance: ' + fileStat.name);
                    visitDeferred.resolve();
                }

                return visitDeferred.promise;
            }

            var cnt = 0;
            var checksum = currentFiles.length;
            _.each(currentFiles, function (file) {
                _visit(parentPath, file, parentID).then(
                    function () {
                        if (checksum <= ++cnt) {
                            cSCATMDeferred.resolve();
                        }
                    }
                );
            });

            return cSCATMDeferred.promise;
        }

        function createCategoryModel(types) {
            var cCMDeferred = new Deferred();

            var typeLen = types.length;
            var cnt = 0;
            _.each(types, function (type) {
                var category = type.name;
                if (category) {
                    categoryStore.add({
                        id: category,
                        name: category,
                        type: 'NT',
                        parent: 'root',
                        internal: type.internal
                    });
                    mountSrc.list(type.src, function (err, files) {
                        if (err) {
                            console.error('Failed to list template directory: ', type.src);
                        } else {
                            //console.log(category, files, categoryStore.data);
                            createSubCategoryAndTemplateModel(type.src, files, category).then(
                                function () {
                                    if (typeLen <= ++cnt) {
                                        cCMDeferred.resolve();
                                    }
                                }
                            );
                        }
                    });
                } else {
                    cnt++;
                }
            });

            return cCMDeferred.promise;
        }

        var process = createCategoryModel(types);
        process.then(function () {
            cMDeferred.resolve();
        });

        return cMDeferred.promise;
    }

    var timeoutID = null;
    function resetTemplateTreeModel(treeItem) {
        if (!!timeoutID) {
            clearTimeout(timeoutID);
        }

        var categoryID = treeItem.id;
        var templates = templateList[categoryID];

        if (!!templateStore.data && templateStore.data.length > 0) {
            templateStore.removeAll();
        }

        if (templates && templates.length > 0) {
            // reset store
            templateStore.addAll(templates);
        } else {
            timeoutID = setTimeout(resetTemplateTreeModel(treeItem), 500);
        }

        var tTree = reg.byId('templateTree');
        tTree.onClick(tTree.selectedItem);
    }

    function resetAllDescriptions(treeItem) {
        clearPreviwImages();
        clearDescription();

        if (treeItem && treeItem.template) {
            var template = treeItem.template;
            console.log('resetAllDescriptions', template.path);
            var imgsPath = [];
            /* jshint camelcase: false */
            if (template.screen_shot) {
                if (_.isString(template.screen_shot)) {
                    imgsPath.push(Util.concatWFSPath([webida.conf.fsServer,
                                                      Constants.API_FS_FILE + '/',
                                                      srcFS, template.path,
                                                      template.screen_shot]));
                } else if (_.isArray(template.screen_shot)) {
                    if (template.screen_shot.length > 0) {
                        _.each(template.screen_shot, function (img) {
                            imgsPath.push(Util.concatWFSPath([webida.conf.fsServer,
                                                              Constants.API_FS_FILE + '/',
                                                              srcFS, template.path, img]));
                        });
                    } else {
                        imgsPath.push('');
                    }
                }
                createImagesElem(imgsPath);
            } else {
                imgsPath.push('');
                createImagesElem(imgsPath);
            }
            /* jshint camelcase: true */

            if (template.description) {
                var ext = template.description.substring(
                    template.description.lastIndexOf('.'),
                    template.description.length)
                    .toLowerCase();
                var path = Util.concatWFSPath([template.path, template.description]);
                console.log('Reading...', path);
                mountSrc.readFile(path, function (err, content) {
                    if (err) {
                        toastr.error(PW_MSG.FS_READ_FILE_FAILED, PW_MSG.ERROR);
                        console.error(PW_MSG.FS_READ_FILE_FAILED, path);
                    } else {
                        var desc;
                        if (ext === '.html') {
                            desc = '<div>' + content + '</div>';
                        } else if (ext === '.md') {
                            var converter = new Markdown.Converter({
                                targetBlank: true
                            });
                            var markdownToHtml = converter.makeHtml;
                            desc = markdownToHtml(content);
                        }
                        $('#pw-descDescPane').empty().append(desc);

                        var anchors = $('#pw-descDescPane a');
                        /* jshint -W107 */
                        _.each(anchors, function (anchor) {
                            anchor.href = 'javascript:open("' + anchor.href + '")';
                        });
                        /* jshint +W107 */
                    }
                });
            }
        }
    }

    function initTemplate() {
        function createCategoryTree() {
            var categoryModel = new ObjectStoreModel({store: categoryStore, query: {id: 'root'}});
            var tree = new Tree({
                id: 'categoryTree',
                model: categoryModel,
                autoExpand: true,
                showRoot: false,
                visited: false,
                getIconClass: function () { return ''; },
                onClick: function () {}
            }, 'categoryTree');
            tree.startup();
            var treePane = reg.byId('pw-category-tree');
            treePane.addChild(tree);

            // auto set first category
            tree.watch('selectedItem', function () {
                console.log('categoryTree', tree.selectedItem);
                resetTemplateTreeModel(tree.selectedItem);
                var childNodes = templateStore.getChildren({
                    id: 'root'
                });
                if (childNodes.length > 0) {
                    templateTree.set('paths', [
                        ['root', childNodes[0].id]
                    ]);
                } else {
                    console.log('Empty templateStore');
                }
            });

            aspect.after(tree, 'onLoad', function () {
                tree.set('paths', [['root', categoryStore.data[1].id]]);
            });

            // tree disabled multiple selection
            tree.dndController.singular = true;

            return tree;
        }

        function createTemplateTree() {
            var templateModel = new ObjectStoreModel({store: templateStore, query: {id: 'root'}});
            templateTree = new Tree({
                id: 'templateTree',
                model: templateModel,
                showRoot: false,
                visited: false
                /*
                onClick: function (treeItem) {
                    // resetAllDescriptions(tree_item);
                }
                 */
            }, 'templateTree');
            templateTree.startup();
            var treePane = reg.byId('pw-template-tree');
            treePane.addChild(templateTree);

            templateTree.watch('selectedItem', function () {
                console.log('templateTree', templateTree.selectedItem);
                resetAllDescriptions(templateTree.selectedItem);
            });

            templateTree.dndController.singular = true;

            return templateTree;
        }

        console.log('Reading...', TYPES_FILE);
        mountSrc.readFile(TYPES_FILE, cbError(PW_MSG.FS_READ_FILE_FAILED + ': ' + 'types.json', function (content) {
            try {
                var types = JSON.parse(content);
                var process = createModels(types);
                process.then(function () {
                    createCategoryTree();
                    createTemplateTree();
                });
            } catch (e) {
                console.log('JSON.parse error: ' + e.message);
                toastr.error(PW_MSG.FS_JSON_PARSE_FAILED, PW_MSG.ERROR);
                return;
            }
        }));
    }

    function clearPreviwImages() {
        $('#pw-descImagesPane').empty();
    }

    function createImagesElem(images) {
        if (images) {
            _.each(images, function (img) {
                var $li = $('<li></li>');
                var $imgElem = $('<img style="width: 100%; height: 100%;">').attr('src', img);
                $li.append($imgElem);
                $('#pw-descImagesPane').append($li);
            });
        }
        initPreviewImage(); // re-init sly setting
    }

    function clearDescription() {
        _.each($('#pw-descDescPane').children(), function (child) {
            child.remove();
        });
    }

    function getSelectedTemplate() {
        var tree = reg.byId('templateTree');
        if (tree) {
            return tree.selectedItem;
        }
        return null;
    }

    function cbError(msg, cb) {
        return function (err, content) {
            if (err) {
                console.log(msg, err);
                toastr.error(msg, PW_MSG.ERROR);
            } else {
                cb(content);
            }
        };
    }

    function onCreateProject(event, prjName, selectedTemplate, options) {
        function createProject() {
            function createDefaultProjectConf() {
                var name = projectName ? projectName : item.name;
                var pConf = createProjectConf(name, item.template, options);
                var pConfText = JSON.stringify(pConf);
                var pcPath = Util.concatWFSPath([destSelect, projectName, '.project']).replace(destFS, '');

                mountDest.createDirectory(pcPath,
                                          cbError(PW_MSG.FS_CREATE_DIRECTORY_FAILED + ': ' + pcPath, function () {
                    mountDest.writeFile(pcPath + '/project.json', pConfText,
                                        cbError(PW_MSG.FS_WRITE_FILE_FAILED + ': ' +
                                                pcPath + '/project.json', function () {
                        toastr.success(PW_MSG.PROJECT_CREATE_SUCCESS.format(name), PW_MSG.SUCCESS);

                        window.postMessage('project_created:' + [destFS, destSelect, projectName].join(','), '*');
                        //onCloseProject();
                    }));
                }));

                topic.publish('webida.ide.project-management.run:configuration.changed', 'save', pConf.run.list[0]);
            }

            function copy() {
                var wwwPath = 'www';
                var destPrjPath = destFSCopyPath; // wfs://gkAn6LI4c//test/r1
                var destPath = destFSPath; // /test/r1
                // copy project resources to 'www' directory
                if (options.supportsCordova) {
                    destPrjPath += '/' + wwwPath;
                }
                mountSrc.copy(srcFSPrjPath, destPrjPath, true,
                              cbError(PW_MSG.FS_COPY_FILE_FAILED + ': ' +
                                      srcFSPrjPath + ' to ' + destPrjPath, function () {
                    createDefaultProjectConf();

                    /* jshint camelcase: false */
                    // For the performance reason, just apply templating for the specific files after batch copy.
                    var file = (item.template.app_class === 'org.webida.run.java') ?
                        (item.template.srcDir + '/' + item.template.app_main.replace(/\./g, '/') + '.java') :
                        'index.html';
                    /* jshint camelcase: true */
                    if (options.supportsCordova) {
                        file = wwwPath + '/' + file;
                    }

                    doTemplate(mountDest, destPath + '/' + file, file);

                    if (options.supportsCordova) {
                        generateWidgetConfig();
                        copyRes(destFSCopyPath);
                    }
                }));
            }

            function generateWidgetConfig() {
                var file = 'config.xml';
                console.log('Generating \'' + file + '\'...');
                // srcFSPath = /workspaces/internal/default/basic
                // destFSCopyPath = wfs://gkAn6LI4c//test/q1
                var srcFile = '/' + getInternalTemplatePath() + '/' + file;
                doTemplate(mountSrc, srcFile, file);
            }

            function copyRes(destFSCopyPath) {
                var srcPath = '/' + getInternalTemplatePath() + '/res';
                console.log('Resource copy', srcPath);
                mountSrc.copy(srcPath, destFSCopyPath + '/res', true,
                              cbError(PW_MSG.FS_COPY_FILE_FAILED + ': ' +
                                      srcPath + ' to ' + destFSCopyPath, function () {
                }));
            }

            copy();
        }

        function doTemplate(mnt, srcFile, file) {
            mnt.readFile(srcFile, cbError(PW_MSG.FS_READ_FILE_FAILED + ': ' + srcFile, function (content) {
                doTemplateFile(file, content);
            }));
        }

        function doTemplateFile(file, content) {
            var path = Util.concatWFSPath([destSelect, projectName]).replace(destFS, '');
            mountDest.writeFile(path + '/' + file, _.template(content, {
                app: {
                    name: projectName,
                    packageName: BuildProfile.getDefaultPackageName(projectName),
                    version: BuildProfile.getDefaultVersionName(),
                    supportsCordova: options.supportsCordova
                }
            }), cbError(PW_MSG.FS_WRITE_FILE_FAILED + ': ' + path, function () {}));
        }

        function isValidInfo() {
            var error;

            if (!item) {
                error = { msg: PW_MSG.TEMPLATE_NOT_SELECTED };
            } else if (destSelect.length === 0) {
                error = { msg: PW_MSG.TARGET_PATH_NOT_GIVEN };
            } else if (!!projectName) {
                var re = /(^\s*)|(\s*$)/gi;
                projectName = projectName.replace(re, '');
                if (projectName.length > 255) {
                    error = { msg: PW_MSG.PROJECT_NAME_LONG};
                } else {
                    re = /^[\w\-]+$/;
                    if (!re.test(projectName)) {
                        error = { msg: PW_MSG.PROJECT_NAME_SPECIAL };
                    }
                }
            } else if (!projectName && projectName.length === 0) {
                error = { msg: PW_MSG.PROJECT_NAME_NOT_GIVEN };
            }

            if (error) {
                toastr.error(error.msg, PW_MSG.INPUT_VALIDATION_ERROR);
                return false;
            }
            return true;
        }

        function isValidFSInfo() {
            mountDest.exists(destFSPath, function (err, exists) {
                if (err)  {
                    console.log(err.reason);
                    toastr.error(PW_MSG.FS_EXISTS_FAILED, PW_MSG.ERROR);
                } else if (exists) {
                    toastr.error(PW_MSG.PROJECT_EXISTS, PW_MSG.ERROR);
                } else {
                    mountSrc.exists(srcFSPrjPath, function (err, exists) {
                        if (err) {
                            console.log(err.reason);
                            toastr.error(PW_MSG.FS_EXISTS_FAILED, PW_MSG.ERROR);
                        } else if (!exists) {
                            console.log('bad template: no project directory in ' + srcFSPrjPath, PW_MSG.ERROR);
                            toastr.error(PW_MSG.TEMPLATE_NOT_EXISTS, PW_MSG.ERROR);
                        } else {
                            createProject();
                        }
                    });
                }
            });
        }

        var item = selectedTemplate ? selectedTemplate : getSelectedTemplate();
        console.log('onCreateProject', options);
        var projectName = prjName;
        var destSelect = targetPath;

        var srcFSPath = '/' + (item && item.template && item.template.path ? item.template.path : '');
        var srcFSPrjPath = srcFSPath + '/project';
        //console.log('destFSPath', destSelect, projectName);
        var destFSPath = Util.concatWFSPath([destSelect, projectName]);
        var destFSCopyPath = Util.concatWFSPath(['wfs://', destFS, destSelect, projectName]);

        if (!isValidInfo()) {
            return;
        } else {
            isValidFSInfo();
        }
    }

    function onCloseProject() {
        console.log('onCloseProject');
        function closeProjectWizard() {
            categoryStore.removeAll();
            templateStore.removeAll();
            templateList = {};
        }

        window.postMessage('project_close', '*');
        closeProjectWizard();
    }

    function addEventListener() {
        var previewFrame = $('#pw-previewFrame');
        previewFrame.click(function () {
            var popup = $('#preview-popup');
            var popupPreviewImage = popup.find('.preview-image');
            var popupCloseBt = popup.find('.dialog-close-button');
            var popupLeftBt = popup.find('.preview-left-button');
            var popupRightBt = popup.find('.preview-right-button');

            popupPreviewImage.children().remove();

            // set new preview image in popup
            var previewList = $('#pw-descImagesPane li');
            var previewImgList = previewList.find('img').clone().hide();
            var activeIndex = 0;
            if (!!previewList && previewList.length > 0) {
                _.each(previewList, function (item, index) {
                    if (!!item.className && item.className.indexOf('active') === 0) {
                        activeIndex = index;
                    }
                });
            }

            if (!!previewImgList && previewImgList.length > 0) {
                _.each(previewImgList, function (item) {
                    popupPreviewImage.append(item);
                });
            }
            $(previewImgList[activeIndex]).show();

            popup.fadeIn(100);

            popupLeftBt.off('click').on('click', function (e) {
                if (activeIndex !== 0) {
                    activeIndex--;
                    previewImgList.hide();
                    $(previewImgList[activeIndex]).fadeIn(500);
                }

                e.stopPropagation();
                e.preventDefault();
            });

            popupRightBt.off('click').on('click', function (e) {
                if (activeIndex !== (previewImgList.length - 1)) {
                    activeIndex++;
                    previewImgList.hide();
                    $(previewImgList[activeIndex]).fadeIn(500);
                }

                e.stopPropagation();
                e.preventDefault();
            });

            popupCloseBt.off('click').on('click', function (e) {
                popup.fadeOut(100);

                e.stopPropagation();
                e.preventDefault();
            });
        });

        // We don't need window event listeners.
    }

    function _mount(fsid) {
        return webida.fs.mountByFSID(fsid);
    }

    function init(path) {
        console.log('init', path);
        targetPath = path;

        addEventListener();
        // If this is called here, the div in 'Project Wizard' tab is hidden.
        // So the width of $frame is 0 and preview image is aligned abnormally.
        // I call this when the 'Project Wizard' tab is selected.
        //initPreviewImage();
        initFileSystem();
    }

    return {
        'init': init,
        'initPreviewImage': initPreviewImage,
        'onCreateProject': onCreateProject,
        'onCloseProject': onCloseProject,
        'getInternalTemplatePath': getInternalTemplatePath
    };
});
