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
 * Compatible LifecycleManager for legacy view system.
 *
 * @see LifecycleManager
 * @since: 2015.12.04
 * @author: hw.shim@samsung.com
 */

// @formatter:off
define([
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/CompatibleTabPartContainer',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './lifecycle-manager',
    './plugin'
], function (
    workbench,
    CompatibleTabPartContainer,
    genetic,
    Logger,
    lifecycleManager,
    editors
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var compatibleLifecycleManager = genetic.mixin(lifecycleManager, {

        /**
         * For legacy view system compatibility
         * @protected
         * @Override
         */
        _showExistingPart : function (PartClass, dataSource, options, callback) {
            logger.info('_showExistingPart(PartClass, ' + dataSource + ', ' + options + ', callback)');
    
            var page = workbench.getCurrentPage();
            var registry = page.getPartRegistry();
            var part = registry.getRecentEditorPart(dataSource, PartClass);
    
            //Compatibility start
            var view = part.getContainer().getWidgetAdapter().getWidget();
            if (view.getParent()) {
                view.getParent().select(view);
                part.focus();
            }
            //Compatibility end
    
            if (typeof callback === 'function') {
                callback(part);
            }
        },

        /**
         * For legacy view system compatibility
         * @protected
         * @Override
         */
        _createPart : function (PartClass, dataSource, options, callback) {
            logger.info('%c_createPart(PartClass, ' + dataSource + ', ' + options + ', callback)', 'color:green');
    
            //Compatibility start
            //editors.files[dataSource.getId()] = dataSource.getPersistence();
            //Compatibility end
    
            var page = workbench.getCurrentPage();
            var layoutPane = page.getChildById('webida.layout_pane.center');
    
            //3. create Tab & add to Pane
            var tabPartContainer = new CompatibleTabPartContainer(dataSource);
            layoutPane.addPartContainer(tabPartContainer, options, editors);
    
            //4. create Part
            tabPartContainer.createPart(PartClass, callback);
        }
    });

    return compatibleLifecycleManager;
});
