var socket = io.connect("http://localhost:3000/");

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

var ifDuplicateDeleteBoth = function(a, b){
	$.each(a, function(index, value){
		var result = $.inArray(value, b);
		if(result > -1){
			a.splice(index, 1);
			b.splice(result, 1);
			return;
		}
	});
}

var createMessageDOM = function (nickname, message, date) {
    var nick = $("<span class='nick'></span>").text(nickname),
        msg = $("<span class='msg'></span>").text(message),
        time = $("<time></time>").text(date.toLocaleTimeString());
    
    return = $("<pre></pre>").append(time).append(nick).append(msg);
};

$(document).ready(function() {
	socket.on("connection", function(data){
		if(!data.ircConnected){
			$("#connect-modal").reveal();
		}
	});

	$("#connect-modal button").click(function(){
		socket.emit("connect", {
			"nick": $("#nick").val(),
			"server": $("#server").val(),
			"port": $("#port").val()
		});
	});

	socket.on("irc", function(data){
		data.server = "server";
		data.date = new Date(data.date);
		console.log(data);
		if(data.serverMsg){
		   if($("section.server.server_"+data.server).length === 0){
				$("body").append("<section class='server server_"+data.server+"'></section>");
			}
		} else if(data.type == "quit"){
			data.channels.forEach(function(chan){
				chan = chan.replace("#", "")
				$("section.chan.server_"+data.server+".chan_"+chan).append("<pre>"+
					"<time>"+data.date.toLocaleTimeString()+"</time>"+
					"<span class='event quit'></span>"+
					"<span class='msg'>"+data.nick+" quit irc ("+data.reason+")</span>"+
				"</pre>");
			});
		} else if(data.type == "pm" || data.type == "pm-action"){
			var section = "section.pm.server_"+data.server+".pm_"+data.pm;
			if($(section).length === 0){
				$("body").append("<section class='pm server_"+data.server+" pm_"+data.pm+"'>"+
				"</section>");
			}
			if(data.type == "pm"){
				$(section).append(createMessageDOM(data.nick, data.msg, data.date))
			} else if(data.type == "pm-action"){
				$(section).append(createMessageDOM(data.nick, data.action, data.date))
			}
		} else {
			data.chan = data.chan.replace("#", "");
			var section = "section.chan.server_"+data.server+".chan_"+data.chan;
			if($(section).length === 0){
				$("body").append("<section class='chan server_"+data.server+" chan_"+data.chan+"'>"+
					"<pre class='topic'></pre>"+
				"</section>");
			}
			if(data.type == "msg"){
				$(section).append(createMessageDOM(data.nick, data.msg, data.date))
			} else if(data.type == "action"){
				$(section).append(createMessageDOM(data.nick, data.action, data.date))
			} else if(data.type == "join"){
				$(section).append("<pre>"+
					"<time>"+data.date.toLocaleTimeString()+"</time>"+
					"<span class='event join'></span>"+
					"<span class='msg'>"+data.nick+" joined "+data.chan+"</span>"+
				"</pre>");
			} else if(data.type == "part"){
				$(section).append("<pre>"+
					"<time>"+data.date.toLocaleTimeString()+"</time>"+
					"<span class='event part'></span>"+
					"<span class='msg'>"+data.nick+" left "+data.chan+" ("+data.reason+")</span>"+
				"</pre>");
			} else if(data.type == "kick"){
				$(section).append("<pre>"+
					"<time>"+data.date.toLocaleTimeString()+"</time>"+
					"<span class='event kick'></span>"+
					"<span class='msg'>"+data.nick+" was kicked from "+data.chan+" by "+data.by+" ("+data.reason+")</span>"+
				"</pre>");
			}
		}
	});

	function detectCmd(callback){
		var input = $("input:first").val();
		var channel = "#high5";
		if(input.search(/^\/topic/i) > -1){
			callback({
				"type": "topic",
				"chan": channel,
				//"nick": nick,
				"topic": input.replace("/topic ", "")
			});
		} else if(input.search(/^\/join/i) > -1){
			callback({
				"type": "join",
				"chan": input.replace("/join ", ""),
				//"nick": nick
			});
		} else if(input.search(/^\/part/i) > -1){
			callback({
				"type": "part",
				"chan": channel,
				//"nick": nick,
				"reason": input.replace("/part ", "")
			});
		} else if(input.search(/^\/quit/i) > -1){
			callback({
				"type": "quit",
				"chans": channels,
				//"nick": nick,
				"reason": input.replace("/quit ", "")
			});
		} else if(input.search(/^\/kick/i) > -1){
			callback({
				"type": "kick",
				"chan": channel,
				"nick": input.replace("/kick ", ""),
				//"by": by,
				"reason": ""
			});
		} else if(input.search(/^\/me/i) > -1){
			callback({
				"type": "action",
				"chan": channel,
				//"nick": nick,
				"action": input.replace("/me ", "")
			});
		} else {
			callback({
				"type": "msg",
				"chan": channel,
				//"nick": nick,
				"msg": input
			});
		}
	}

	$("form").submit(function(){
		detectCmd(function(data){
			socket.emit("irc", data);
			$("input:first").val("")
		});
		return false;
	});

	buffers = {};
	buffers.list = [];

	socket.on("buffers", function(buffersFromServer){
		buffers.list = buffersFromServer.diff(buffers.list);
		$("aside.buffer-list ul").empty();
		$.each(buffers.list, function(index, value){
			$("aside.buffer-list ul").append("<li><span class='name'>"+value+"</span><span class='pings'></span></li>");
		});
	});
});