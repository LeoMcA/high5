var socket = io.connect("http://localhost:3000/");

$(document).ready(function() {

	socket.on("connection", function(data){
		if(!data.ircConnected){
			$(".modal").modal();
		}
	});

	$(".modal").on("hidden", function(){
		socket.emit("connect", {
			"nick": $("#nick").val(),
			"server": $("#server").val(),
			"port": $("#port").val(),
			"channels": $("#channels").val()
		});
	});

	socket.on("irc", function(data){
		data.date = new Date(data.date);
		console.log(data);
		if(data.type == "motd"){
			var buffer = "#server tbody";
			if($(buffer).length === 0){
				createBuffer("server", "Server");
				$("#server").addClass("active");
			}
			$(buffer).append(createMessageDOM("server", data.motd, data.date));
		} else if(data.type == "notice"){
			var buffer = "#server tbody";
			if($(buffer).length === 0){
				createBuffer("server", "Server");
				$("#server").addClass("active");
			}
			$(buffer).append(createMessageDOM("server", data.notice, data.date, data.ping));
		} else if(data.type == "quit"){
			$.each(data.chans, function(index, chan){
				chan = chan.replace("#", "");
				$("#chan_"+chan+" tbody").append(createEventDOM("quit", data.nick + " quit irc (" + data.reason + ")", data.date, data.ping));
			});
		} else if(data.type == "nick"){
			$.each(data.chans, function(index, chan){
				chan = chan.replace("#", "");
				$("#chan_"+chan+" tbody").append(createEventDOM("nick", data.oldnick+" is now known as "+data.newnick, data.date));
			});
		} else if(data.type == "pm" || data.type == "pm-action"){
			var buffer = "#pm_"+data.pm+" tbody";
			if($(buffer).length == 0){
				createBuffer("pm_"+data.pm, data.pm);
			}
			if(data.type == "pm"){
				$(buffer).append(createMessageDOM(data.nick, data.msg, data.date, data.ping, data.pm));
			} else if(data.type == "pm-action"){
				$(buffer).append(createActionDOM(data.nick, data.action, data.date, data.ping, data.pm));
			}
		} else {
			data.chanNoHash = data.chan.replace("#", "");
			var buffer = "#chan_"+data.chanNoHash+" tbody";
			if($(buffer).length == 0){
				createBuffer("chan_"+data.chanNoHash, data.chan);
			}
			if(data.type == "msg"){
				$(buffer).append(createMessageDOM(data.nick, data.msg, data.date, data.ping, data.chan));
			} else if(data.type == "action"){
				$(buffer).append(createActionDOM(data.nick, data.action, data.date, data.ping, data.chan));
			} else if(data.type == "join"){
				$(buffer).append(createEventDOM("join", data.nick+" joined "+data.chan, data.date));
			} else if(data.type == "part"){
				$(buffer).append(createEventDOM("part", data.nick+" left "+data.chan+" ("+data.reason+")", data.date, data.ping));
			} else if(data.type == "kick"){
				$(buffer).append(createEventDOM("kick", data.nick+" was kicked from "+data.chan+" by "+data.by+" ("+data.reason+")", data.date, data.ping)); 
			} else if(data.type == "topic"){
				$("#chan_"+data.chanNoHash+" .topic").text(data.topic);
				$(buffer).append(createEventDOM("topic", data.nick+" changed the topic to \""+data.topic+"\"", data.date, data.ping));
			} else if(data.type == "names"){
				$("#chan_"+data.chanNoHash+" .user-list ul").empty();
				if(data.nicks.ops.length > 0){
					$("#chan_"+data.chanNoHash+" .user-list ul").append("<li class='nav-header'><a href='#'>Ops</a></li>");
					data.nicks.ops.forEach(function(val){
						$("#chan_"+data.chanNoHash+" .user-list ul").append("<li><a href='#'>"+val+"</a></li>");
					});
				}
				if(data.nicks.hops.length > 0){
					$("#chan_"+data.chanNoHash+" .user-list ul").append("<li class='nav-header'><a href='#'>Half-ops</a></li>");
					data.nicks.hops.forEach(function(val){
						$("#chan_"+data.chanNoHash+" .user-list ul").append("<li><a href='#'>"+val+"</a></li>");
					});
				}
				if(data.nicks.voices.length > 0){
					$("#chan_"+data.chanNoHash+" .user-list ul").append("<li class='nav-header'><a href='#'>Voice</a></li>");
					data.nicks.voices.forEach(function(val){
						$("#chan_"+data.chanNoHash+" .user-list ul").append("<li><a href='#'>"+val+"</a></li>");
					});
				}
				if(data.nicks.users.length > 0){
					$("#chan_"+data.chanNoHash+" .user-list ul").append("<li class='nav-header'><a href='#'>Users</a></li>");
					data.nicks.users.forEach(function(val){
						$("#chan_"+data.chanNoHash+" .user-list ul").append("<li><a href='#'>"+val+"</a></li>");
					});
				}
				$("#chan_"+data.chanNoHash+" .input form").empty();
				$("#chan_"+data.chanNoHash+" .input form").append("<input type='text' data-provide='typeahead'>");
				$("#chan_"+data.chanNoHash+" .input input").typeahead({
					source: data.nicks.all
				});
			} else if(data.type="+mode"){
				$(buffer).append(createEventDOM("mode", data.chan+" [+"+data.mode+" "+data.arg+"] by "+data.by, data.date));
			} else if(data.type="-mode"){
				$(buffer).append(createEventDOM("mode", data.chan+" [-"+data.mode+" "+data.arg+"] by "+data.by, data.date));
			}
		}
		correctDisplay();
	});

	$(".modal-body form").submit(function(){
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