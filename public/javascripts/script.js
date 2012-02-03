var socket = io.connect("http://localhost:3000/");

var createTimeDOM = function (date) {
	return $("<time></time>").text(date.toLocaleTimeString());
};

var createMessageDOM = function (nickname, message, date) {
    var nick = $("<span class='nick'></span>").text(nickname),
        msg = $("<span class='msg'></span>").text(message),
        time = createTimeDOM(date);
    
    return $("<pre></pre>").append(time).append(nick).append(msg);
};

var createEventDOM = function (event, interaction, date) {
	var event = $("<span></span>").addClass('event').addClass(event),
	    message = $("<span></span>").addClass('msg').text(interaction);
	    
	return $("<pre></pre>").append(createTimeDOM(date)).append(event).append(message);
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
			"port": $("#port").val(),
			"channels": $("#channels").val()
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
				$("section.chan.server_"+data.server+".chan_"+chan)
				    .append(createEventDOM("quit", data.nick + " quit irc (" + data.reason + ")", data.date));
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
                    "<aside class='userlist'><ul></ul></aside>"+
					"<pre class='topic'></pre>"+
				"</section>");
			}
			if(data.type == "msg"){
				$(section).append(createMessageDOM(data.nick, data.msg, data.date))
			} else if(data.type == "action"){
				$(section).append(createMessageDOM(data.nick, data.action, data.date))
			} else if(data.type == "join"){
				$(section).append(createEventDOM("join", data.nick+" joined "+data.chan, data.date));
			} else if(data.type == "part"){
				$(section).append(createEventDOM("part", data.nick+" left "+data.chan+" ("+data.reason+")", data.date));
			} else if(data.type == "kick"){
				$(section).append(createEventDOM("kick", data.nick+" was kicked from "+data.chan+" by "+data.by+" ("+data.reason+")", data.date)); 
			} else if(data.type == "names"){
                $(section+" aside.userlist ul").replaceWith("<ul></ul>")
                $.each(data.nicks, function() {
                    $.each(this, function(nick) {
                        $(section+" aside.userlist ul").append("<li>"+nick+"</li>");
                    });
                });
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
				"chan": input.replace("/part ", ""),
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

	socket.on("ircChans", function(data){
		$(".bufferlist").empty();
		$(".bufferlist").append("<ul></ul>");

		data.forEach(function(value){
			var li = $("<li></li>").text(value);
			$(".bufferlist ul").append(li);
		});
	});
});