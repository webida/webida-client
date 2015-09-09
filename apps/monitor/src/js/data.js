
define(['monitorApi'], function (monitorApi) {
    'use strict';
    
    var DataModule = function () {
        
        this.svcTypeList = null;
        this.instNameList = null;
        this.urlList = null;
 
        var self = this;
        var pf = monitorApi.pf;
        
        this.getSvcTypeList = function (callback) {
            if (self.svcTypeList && self.svcTypeList.length > 0) {
                return callback(null, self.svcTypeList);
            }

            pf.getSvcTypeList(function (err, result) {
                if (err) {
                    return callback(err, null);
                }
                self.svcTypeList = result;

                callback(null, self.svcTypeList);
            });
        };
        
        this.getInstNameList = function (callback) {
            if (self.instNameList && self.instNameList.length > 0) {
                return callback(null, self.instNameList);
            }
            
            pf.getInstNameList(function (err, result) {
                if (err) {
                    return callback(err, null);
                }
                self.instNameList = result;
                callback(null, self.instNameList);
            });  
        };
        
        this.getUrlList = function (callback) {
            
            if (self.urlList && self.urlList.length > 0) {
                return callback(null, self.urlList);
            }
            
            pf.getUrlList(function (err, result) {
                if (err) {
                    return callback(err, null);
                }
                self.urlList = result;
                callback(null, self.urlList);
            });
        };
    };
    
    var dataModule = new DataModule();
    return dataModule;
});