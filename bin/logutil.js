// logutil.js
//log setting
var log4js = require("log4js");
var log4js_config = require("./log_config.json");
var LogFile = null;


exports.createLogger = function(category) {
	log4js.configure(log4js_config);
	if(category !== undefined){
		LogFile = log4js.getLogger(category);	
	} else {
		LogFile = log4js.getLogger('log_file');	
	}
	return LogFile;
}