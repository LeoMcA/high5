var socket = io.connect("http://localhost:3000/");

var createMessageDOM = function (nickname, message, date) {
	var time = $("<td></td>").append("<time></time>").text(date.toLocaleTimeString());
	var nick = $("<td></td>").text(nickname);
	var msg = $("<td></td>").text(message);
	
	return $("<tr></tr>").append(time).append(nick).append(msg);
};

var createEventDOM = function (event, interaction, date) {
	var time = $("<td></td>").append("<time></time>").text(date.toLocaleTimeString());
	var type = $("<td></td>").text(event);
	var msg = $("<td></td>").text(interaction);
	var tr = $("<tr></tr>");

	if(event == "join"){
		tr.addClass("label-success");
	} else if(event == "part" || event == "quit" || event == "kick"){
		tr.addClass("label-important");
	} else if(event == "topic"){
		tr.addClass("label-info");
	} else if (event == "mode"){
		tr.addClass("label-warning");
	}
	return tr.addClass("label").append(time).append(type).append(msg);
};

var createBuffer = function(id, name){
	$(".tab-content").append("<div class='tab-pane' id='"+id+"'>"+
								"<div class='row-fluid'>"+
									"<div class='span10'>"+
										"<div class='alert alert-info topic'>"+
										"</div>"+
										"<div class='buffer'>"+
											"<table>"+
												"<tbody>"+
												"</tbody>"+
											"</table>"+
										"</div>"+
									"</div>"+
									"<div class='span2 user-list'>"+
										"<ul class='nav nav-list'>"+
										"</ul>"+
									"</div>"+
								"</div>"+
								"<div class='row-fluid'>"+
					                "<div class='span12 input'>"+
					                    "<form class='form-horizontal'>"+
					                        "<input type='text' data-provide='typeahead'>"+
					                    "</form>"+
					                "</div>"+
					            "</div>"+
							"</div>");
	$(".buffer-list ul").append("<li><a href='#"+id+"' data-toggle='tab'>"+name+"</a></li>");
	correctDisplay();
	$(".input form").each(function(index){
		if(!$(this).hasClass("falsed")){
			$(this).addClass("falsed");
			console.log("Added class 'falsed'");
			$(this).submit(function(){
				var input = $(".active .input input").val();
				var channel = $(".buffer-list .active a").text();
				if(channel == "") return false;
				socket.emit("irc", {
					"activeChan": channel,
					"input": input
				});
				$(".active .input input").val("");
				return false;
			});
		}
	});
}

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
			$(buffer).append(createMessageDOM("server", data.notice, data.date));
		} else if(data.type == "quit"){
			data.chans.forEach(function(chan){
				chan = chan.replace("#", "")
				$("#chan_"+chan)
					.append(createEventDOM("quit", data.nick + " quit irc (" + data.reason + ")", data.date));
			});
		} else if(data.type == "nick"){
			data.chans.forEach(function(chan){
				chan = chan.replace("#", "")
				$("#chan_"+chan)
					.append(createEventDOM("nick", data.oldnick+" is now known as "+data.newnick, data.date));
			});
		} else if(data.type == "pm" || data.type == "pm-action"){
			var buffer = "#pm_"+data.pm+" tbody";
			if($(buffer).length === 0){
				createBuffer("pm_"+data.pm, data.pm);
			}
			if(data.type == "pm"){
				$(buffer).append(createMessageDOM(data.nick, data.msg, data.date));
			} else if(data.type == "pm-action"){
				$(buffer).append(createMessageDOM(data.nick, data.action, data.date));
			}
		} else {
			data.chanNoHash = data.chan.replace("#", "");
			var buffer = "#chan_"+data.chanNoHash+" tbody";
			if($(buffer).length === 0){
				createBuffer("chan_"+data.chanNoHash, data.chan);
			}
			if(data.type == "msg"){
				$(buffer).append(createMessageDOM(data.nick, data.msg, data.date));
			} else if(data.type == "action"){
				$(buffer).append(createMessageDOM(data.nick, data.action, data.date));
			} else if(data.type == "join"){
				$(buffer).append(createEventDOM("join", data.nick+" joined "+data.chan, data.date));
			} else if(data.type == "part"){
				$(buffer).append(createEventDOM("part", data.nick+" left "+data.chan+" ("+data.reason+")", data.date));
			} else if(data.type == "kick"){
				$(buffer).append(createEventDOM("kick", data.nick+" was kicked from "+data.chan+" by "+data.by+" ("+data.reason+")", data.date)); 
			} else if(data.type == "topic"){
				$("#chan_"+data.chanNoHash+" .topic").text(data.topic);
				correctDisplay();
				$(buffer).append(createEventDOM("topic", data.nick+" changed the topic to \""+data.topic+"\"", data.date));
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