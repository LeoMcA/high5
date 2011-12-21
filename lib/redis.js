

exports.logMessages = function(data){
	if(data.type == "motd"){
		redis.rpush("server.motd", data.msg);
	} else if(Array.isArray(data.to)){
		data.to.forEach(function(value){
			redis.rpush("server.channel."+value+".messages", data);
		});
	} else {
		redis.rpush("server.channel."+data.to+".messages", data);
	}
}

exports.getMessages = function(channel, callback){
	redis.lrange("server.channel."+channel+".messages", "0", "-1", function(err, data){
		data.forEach(function(log){
			callback(log);
		});
	});
}

exports.addChanlist = function(channel){
	
}

exports.remChanlist = function(channel){
	
}

exports.delChanlist = function(channel){
	
}

exports.getChanlist = function(){
	
}

exports.setUserlist = function(data){
	
}

exports.getUserlist = function(channel){
	
}