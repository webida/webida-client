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
 *
 * @since: 15. 9. 8
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/util/genetic',
    '../lib/jquery.minicolors.min',
    'plugins/webida.preference/pages/PreferencePage',
    'text!../layout/notification-preference.html',
    'xstyle/css!../style/jquery.minicolors.css'
], function (
    _,
    genetic,
    minicolors,
    PreferencePage,
    template
) {
    function NotificationPreferencePage(store, pageData) {
        PreferencePage.apply(this, arguments);
        this.pageData = pageData;
        this.ui = $(template).get(0);

        store.setValidator(function (key, value) {
            var colorCodePattern = /^#[a-fA-F0-9]{6}$/;
            if (key.endsWith('-color')) {
                if (!colorCodePattern.test(value)) {
                    return 'The value of ' + key + 'should be a HEX color code value.';
                }
            }
        });
    }
    genetic.inherits(NotificationPreferencePage, PreferencePage, {
        _drawComponents: function () {
            var self = this;
            var $ui = $(this.ui);
            var values = this.store.getRealValues();
            $ui.find('.mini-colors').minicolors('destroy');
            _.forEach(values, function (value, key) {
                $ui.find('#' + key).val(value);
            });
            $ui.find('.mini-colors').minicolors({
                change: function (hex) {
                    self.store.setValue($(this).attr('id'), hex);
                }
            });
        },
        getPage: function () {
            this._drawComponents();
            return this.ui;
        },
        onPageAppended: function () {
            PreferencePage.prototype.onPageAppended.call(this);
        },
        onPageRemoved: function () {
            var $ui = $(this.ui);
            $ui.find('.mini-colors').minicolors('destroy');
            PreferencePage.prototype.onPageRemoved.call(this);
        },
        reload: function () {
            this._drawComponents();
        }
    });

    return NotificationPreferencePage;
});
