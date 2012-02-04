var socket = io.connect("http://localhost:3000/");

var createMessageDOM = function (nickname, message, date) {
    var time = $("<td></td>").append("<time></time>").text(date.toLocaleTimeString());
    var nick = $("<td></td>").text(nickname);
    var msg = $("<td></td>").text(message);
    
    return $("<tr></tr>").append(time).append(nick).append(msg);
};

var createEventDOM = function (event, interaction, date) {
	var time = $("<td></td>").append("<time></time>").text(date.toLocaleTimeString());
	var event = $("<td></td>").text(event);
	var msg = $("<td></td>").text(interaction);
	    
	return $("<tr></tr>").append("<span></span>").addClass('label').append(time).append(event).append(msg);
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
	                        "</div>");
	$(".buffer-list ul").append("<li><a href='#"+id+"' data-toggle='tab'>"+name+"</a></li>");
	dynamicStuff();
}

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
		data.date = new Date(data.date);
		console.log(data);
		/*if(data.serverMsg){
		   if($("section.server.server_"+data.server).length === 0){
				$("body").append("<section class='server server_"+data.server+"'></section>");
			}
		} else*/ if(data.type == "quit"){
			data.chans.forEach(function(chan){
				chan = chan.replace("#", "")
				$("#chan_"+chan)
				    .append(createEventDOM("quit", data.nick + " quit irc (" + data.reason + ")", data.date));
			});
		} else if(data.type == "pm" || data.type == "pm-action"){
			var buffer = "#pm_"+data.pm+" tbody";
			if($(buffer).length === 0){
				createBuffer("pm_"+data.pm, data.pm);
			}
			if(data.type == "pm"){
				$(buffer).append(createMessageDOM(data.nick, data.msg, data.date))
			} else if(data.type == "pm-action"){
				$(buffer).append(createMessageDOM(data.nick, data.action, data.date))
			}
		} else {
			data.chan = data.chan.replace("#", "");
			var buffer = "#chan_"+data.chan+" tbody";
			if($(buffer).length === 0){
				createBuffer("chan_"+data.chan, data.chan);
			}
			if(data.type == "msg"){
				$(buffer).append(createMessageDOM(data.nick, data.msg, data.date))
			} else if(data.type == "action"){
				$(buffer).append(createMessageDOM(data.nick, data.action, data.date))
			} else if(data.type == "join"){
				$(buffer).append(createEventDOM("join", data.nick+" joined "+data.chan, data.date));
			} else if(data.type == "part"){
				$(buffer).append(createEventDOM("part", data.nick+" left "+data.chan+" ("+data.reason+")", data.date));
			} else if(data.type == "kick"){
				$(buffer).append(createEventDOM("kick", data.nick+" was kicked from "+data.chan+" by "+data.by+" ("+data.reason+")", data.date)); 
			} /*else if(data.type == "names"){
                $(section+" aside.userlist ul").replaceWith("<ul></ul>")
                $.each(data.nicks, function() {
                    $.each(this, function(nick) {
                        $(section+" aside.userlist ul").append("<li>"+nick+"</li>");
                    });
                });
            } */
		}
	});

	$("form").submit(function(){
		var input = $("input:first").val();
		var channel = "#high5";
		socket.emit("irc", {
			"activeChan": channel,
			"input": input
		});
		$("input:first").val("");
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