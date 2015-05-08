https://github.com/hwshim/logger-interface

# logger-interface

*Client Side*

                "use strict";
                define(function(require, exports, module) {
                	var Logger = require('./logger/logger-client');
                
                	var logger = new Logger();
                	logger.setConfig({});
                	
                	logger.log('test','test',{x:1});
                	function abc(){
                		logger.log('test','test',{x:1});
                		//logger.trace();
                	}	
                	abc();
                	logger.log('%ctest','color:green');
                	logger.info('some information');
                	logger.warn('test');
                	logger.error('test');
                	logger.trace();
                }); 
        
*Server Side*

                var http = require('http');
                var Logger = require('./logger/logger-server');
                http.createServer(function(req, res) {
                	res.writeHead(200, {
                		'Content-Type' : 'text/plain'
                	});
                	res.end('Hello World\n');
                
                	var logger = Logger.getSingleton();
                	
                	function abc(){
                		logger.log([1,2,3]);
                	}
                	abc();
                
                	logger.log('test','test','test');
                	logger.info('test','test','test');
                	logger.warn('test');
                	logger.error('test');
                	logger.trace();
                	
                }).listen(1111, '127.0.0.1');
                console.log('Server running at http://127.0.0.1:1111/');
