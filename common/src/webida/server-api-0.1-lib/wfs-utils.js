"use strict";

define([
    'URIjs'
],  function (
    URI
) {

    var internals = {
        createWfsUrl : function createWfsUrl(parsed) {
            var tmpUri = new URI('').protocol('wfs').path(parsed.wfsId + '/' + parsed.wfsPath);
            return tmpUri.toString();
        },

        parseLegacyUrl : function parseLegacyUrl(legacyUrl) {
            var uri = new URI(legacyUrl);
            var srcPathSegments = uri.normalize().path(true).split('/').slice(1);  // drops heading '/' in path

            var wfsId = srcPathSegments[0];
            if (!wfsId) {
                throw new Error('no fsid part in wfs url' + legacyUrl);
            }

            var wfsPath = srcPathSegments.slice(1).join('/');
            if (!wfsPath || wfsPath === '/') {
                throw new Error('no path part in wfs url ' + legacyUrl);
            }

            // we can drop host of uri, for ide does not access to 'outside' of workspace
            return {
                wfsId: wfsId,
                wfsPath: wfsPath // wfsPath should not have heading '/'
            };
        }
    };

    function fromLegacyPath(legacyPath, wfsId) {
        if (typeof(legacyPath) !== 'string' || legacyPath.constructor.name !== 'String' || !legacyPath) {
            throw new Error('wfs url must a truthy string');
        }
        let ret = '';
        if (legacyPath.indexOf('wfs://') !== 0 ) {
            // looks very heavy but normalizing path is not a simple job. believe me.
            var tmpUri = new URI('file:///' + legacyPath);
            ret = tmpUri.normalize().path(true).slice(1); // should start with /, always
        } else {
            var parsed = internals.parseLegacyUrl(legacyPath);
            if (parsed.wfsId !== wfsId) {
                ret = internals.createWfsUrl(parsed);
            } else {
                ret = parsed.wfsPath;
            }
        }
        if (ret.length > 0 && ret[length-1] === '/') {
            ret = ret.slice(0,-1);
        }
        return ret; 
    }

    function devideArrayWithFilter (array, propertyNameToFilter) {
        var ret = {
            truthy:[],
            falsy:[]
        };

        array.forEach( function (item) {
            var property;
            if (!propertyNameToFilter) {
                property = item;
            } else {
                property = item ? item[propertyNameToFilter] : undefined;
            }
            if (property) {
                ret.truthy.push(item);
            } else {
                if (item) {
                    ret.falsy.push(item);
                }
            }
        });

        return ret;
    }

    return {
        fromLegacyPath : fromLegacyPath,
        devideArrayWithFilter : devideArrayWithFilter
    };
});
