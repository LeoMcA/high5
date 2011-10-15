function nl2br(str) {
	return str.replace(/ /g, " &nbsp;").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1<br>$2");
}

$(document).ready(function() {
	var socket = io.connect("http://localhost:3000/");
	irc = new Object();

	socket.on("irc", function(data){
		console.log(data);
		if(data.type === "registered") irc.registered();
		if(data.type === "motd") irc.motd(data);
		if(data.type === "names") irc.names(data);
		if(data.type === "topic") irc.topic(data);
		if(data.type === "join") irc.join(data);
		if(data.type === "part") irc.part(data);
		if(data.type === "quit") irc.quit(data);
		if(data.type === "kick") irc.kick(data);
		if(data.type === "message") irc.message(data);
		if(data.type === "notice") irc.notice(data);
		if(data.type === "nick") irc.nick(data);
		if(data.type === "invite") irc.invite(data);
		if(data.type === "whois") irc.whois(data);
	});

	irc.registered = function(){
		$("body").append("Connected to IRC!<br>");
	};

	irc.motd = function(data){
		$("body").append(nl2br(data.motd)+"<br>");
	};

	irc.names = function(data){

	};

	irc.topic = function(data){

	};

	irc.join = function(data){
		$("body").append("--&#62; "+data.nick+" joined "+data.channel+"<br>");
	};

	irc.part = function(data){
		$("body").append("&#60;-- "+data.nick+" left "+data.channel+" ("+data.reason+")<br>");
	};

	irc.quit = function(data){
		$("body").append("&#60;-- "+data.nick+" left IRC ("+data.reason+")<br>");
	};

	irc.kick = function(data){
		$("body").append("&#60;-- "+data.nick+" was kicked by "+data.by+" from "+data.channel+" ("+data.reason+")<br>");
	};

	irc.message = function(data){
		$("body").append("&#60;"+data.nick+"&#62; "+nl2br(data.text)+"<br>");
	};
});