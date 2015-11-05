

define(/*['toastr'],*/ function (/*toastr*/) {
    'use strict';
    
    function toggleView(target) {
        if (!target) {
            return;
        }
        
        if (target === '#under-construction') {
            return;
        }
        
        var targetFile = target.replace('#', '');
        require(['right/' + targetFile], function (rightPane) {
            rightPane.init();
        });
    }
    
    return {
        toggleView : toggleView
    };
});