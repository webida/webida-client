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


require([ 'webida-lib/app-config',
         'webida', 'left', 'right', 'toastr'], function (AppConfig, webida, left, right, toastr) {
    'use strict';
    
    webida.auth.initAuth(AppConfig.clientId, AppConfig.redirectUrl);
    webida.auth.getMyInfo(function (e, data) {
        if (e) {
            console.error('getMyInfo error: ' + e);
        } else {
      
            $('#userinfoButton_label').text(data.email);
        }
    });

    $(document).ready(function () {
        $('#cssmenu > ul > li > a').click(function () {
            $('#cssmenu li').removeClass('active');
            $(this).closest('li').addClass('active');	
            var checkElement = $(this).next();
            if ((checkElement.is('ul')) && (checkElement.is(':visible'))) {
                $(this).closest('li').removeClass('active');
                checkElement.slideUp('normal');
            }
            if ((checkElement.is('ul')) && (!checkElement.is(':visible'))) {
                $('#cssmenu ul ul:visible').slideUp('normal');
                checkElement.slideDown('normal');
            }
            if ($(this).closest('li').find('ul').children().length === 0) {
                return true;
            } else {
                return false;	
            }		
        });
        
        $(window).bind('hashchange', function() {
            var hash = location.hash;

            if (hash === '') {
                hash = 'pf-current';
            }

            console.log(hash);
            var target = hash;
            $('.right > div').hide();
            $(target).show();
            right.toggleView(target);
        });
        
        $(window).trigger('hashchange');
    });
    
    /*
    var treeData = left.getTree();
    $('#tree').treeview(
        {
            data: treeData,
            level: 5,
            showBorder: false,
            //backColor: '#eeeeee',
            onNodeSelected: function(event, data) {
                //console.log('tree event = ', event);
                //console.log('tree data = ', data);
                var target = data.href;
                $('.right > div').hide();
                $(target).show();
                right.toggleView(target);

            }
        }
    );
    */
    
});