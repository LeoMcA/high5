$(document).ready(function() {
	chanlist = [];
	qwerty = ["q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x","c","v","b","n","m"];
	var socket = io.connect("http://high5.leomca.c9.io/");
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
	
	function createPre(classes){
		if($("pre."+classes).length === 0){
			$("body").append("<pre class='"+classes.replace(/\./g, " ")+"'>");
			$("pre.server").hide();
			$("pre.server.channel."+location.pathname.split("/")[2]+".messages").show();
		}
	}
	
	function findInArray(array, str){
		position = $.each(array, function(index, value){
			if(value === str){
				return index;
			} else {
				return false;
			}
		});
		return position;
	}
	
	function convertToBind(index){
		if(index < 9){
			return index+1;
		} else if(index === 9){
			return 0;
		} else if(index < 37){
			return qwerty[index-10];
		} else {
			return index+1;
		}
	}
	
	function modChanlist(action, data){
		if(data.nick === "leo|high5"){
			if(action === "join"){
				chanlist.push(data.channel);
			}
			if(action === "part" || "kick"){
				chanlist.splice(findInArray(chanlist, data.channel), 1);
			}
			if(action === "quit"){
				chanlist = [];
			}
		}
		$("pre.chanlist").replace();
		$.each(chanlist, function(index, value){
			$("pre.chanlist").append(convertToBind(index)+" | "+value+"<br>");
		});
	}

	irc.registered = function(){
	};

	irc.motd = function(data){
		createPre("server.messages");
		$("pre.server.messages").append(data.motd+"<br>");
	};

	irc.names = function(data){

	};

	irc.topic = function(data){

	};

	irc.join = function(data){
		createPre("server.channel."+data.channel.replace("#", "")+".messages");
		$("pre.server.channel."+data.channel.replace("#", "")+".messages").append("--&#62; "+data.nick+" joined "+data.channel+"<br>");
		modChanlist("join", data);
	};

	irc.part = function(data){
		createPre("server.channel."+data.channel.replace("#", "")+".messages");
		$("pre.server.channel."+data.channel.replace("#", "")+".messages").append("&#60;-- "+data.nick+" left "+data.channel+" ("+data.reason+")<br>");
		modChanlist("part", data);
	};

	irc.quit = function(data){
		$("pre.messages").append("&#60;-- "+data.nick+" left IRC ("+data.reason+")<br>");
		modChanlist("quit");
	};

	irc.kick = function(data){
		createPre("server.channel."+data.channel.replace("#", "")+".messages");
		$("pre.server.channel."+data.channel.replace("#", "")+".messages").append("&#60;-- "+data.nick+" was kicked by "+data.by+" from "+data.channel+" ("+data.reason+")<br>");
		modChanlist("kick", data);
	};

	irc.message = function(data){
		createPre("server.channel."+data.to.replace("#", "")+".messages");
		$("pre.server.channel."+data.to.replace("#", "")+".messages").append("&#60;"+data.nick+"&#62; "+data.text+"<br>");
	};
});