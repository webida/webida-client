
define([
    'external/URIjs/src/URI'
],  function (
    URI
) {
    "use strict";
    var publics = {
        bootArgs : null
    };
    var privates = {
        swaggerClient : null
    };

    // for embedded server
    //   - main process will set some 'boot token', randomly chosen when webida desktop starts
    //   - embedded server understands boot token and convert it to actual jwt for any webida client
    //   - auth.initAuth() will send boot token to server if set
    //   (in next version, initAuth will be removed & auth.login() will handle it directly)

    // module-wide variables
    function getSwaggerClientAsync() {
        return new Promise( function(resolve, reject) {
            if (privates.swaggerClient) {
                resolve(swaggerCleint);
            } else {
                reject( new Error('get Swagger client is not impelmented yet') );
            }
        });
    }

    function initialize() {
        // for embedded server
        //   - main process will set some 'boot token', randomly chosen when webida desktop starts
        //   - embedded server understands boot token and convert it to actual jwt for any webida client
        //   - auth.initAuth() will send boot token to server if set
        //   (in next version, initAuth will be removed & auth.login() will handle it directly)
        var locationUri = new URI (window.location.href);
        publics.bootArgs = locationUri.query;
    }

    /* module script */
    initialize();
    return {
        bootArgs : publics.bootArgs,
        getSwaggerClientAsync : getSwaggerClientAsync
    };

});
