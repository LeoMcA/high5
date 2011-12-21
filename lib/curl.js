var util  = require('util');
var exec = require('child_process').exec;

exports.curl = function(method, data, url, callback){
	exec("curl -X '"+method+"' -d '"+data+"' '"+url+"'", function(error, stdout){
    	if (error !== null) {
    		console.log("exec error: "+error);
    	}
    	callback(stdout);
	});
}