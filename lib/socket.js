exports.listen = function(port){
	var io = require("socket.io").listen(port);
}

exports.send(data){
	io.sockets.emit("irc", data);
}

exports.get(callback){
	io.sockets.on("connection", function(sockets){
		io.socket.on("irc", callback(data));
	});
}