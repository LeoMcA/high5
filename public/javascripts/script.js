$(document).ready(function() {

	// ---------- socket.io stuff ----------

	var socket = io.connect("http://localhost:3000/");

	// ---------- messages from irc bouncer ----------

	irc = new Object();

	socket.on("ircNick", function(data){
			ircNick = data;
		});

	socket.on("ircServerMsg", function(data){
		if(data.to == "server"){
			createPre("server.messages");
			$("pre.server.messages").append(data.msg);
		} else {
			createPre("server.channel."+data.to.replace("#", "")+".messages");
			$("pre.server.channel."+data.to.replace("#", "")+".messages").append(data.msg);
		}
	});

	// ---------- messages to irc bouncer ----------

	$("form.send").submit(function(){
		socket.emit("ircClientMsg", {
			"chan": location.pathname.split("/")[1],
			"msg": $("input:first").val()
		});
		$("input:first").val("")
		return false;
	});

	// ---------- chanlist stuff ----------

	chanlist = [];

	socket.on("chanlist", function(chanlistFromServer){
		chanlist = chanlistFromServer;
		$("pre.chanlist").replaceWith("<pre class='chanlist'></pre>");
		$.each(chanlist, function(index, value){
			$("pre.chanlist").append(convertToBind(index)+" | "+value+"<br>");
		});
	});

	// changing the channel

	jwerty.key("Alt+1/Alt+2/Alt+3/Alt+4/Alt+5/Alt+6/Alt+7/Alt+8/Alt+9/Alt+0/Alt+q/Alt+w/Alt+e/Alt+r/Alt+t/Alt+y/Alt+u/Alt+i/Alt+o/Alt+p/Alt+a/Alt+s/Alt+d/Alt+f/Alt+g/Alt+h/Alt+j/Alt+k/Alt+l/Alt+z/Alt+x/Alt+c/Alt+v/Alt+b/Alt+n/Alt+m", function(foo, keypressed){
		changeChan(keypressed.replace("alt+", ""));
		return false;
	});
	
	function changeChan(keypressed){
		if(keypressed == "1"){
			history.replaceState(false, false, "/");
			$("pre.server").hide();
			$("pre.server.messages").show();
		} else {
			history.replaceState(false, false, chanlist[convertToChan(keypressed)].replace("#", ""));
			$("pre.server").hide();
			$("pre.server.channel."+chanlist[convertToChan(keypressed)].replace("#", "")+".messages").show();
		}
	}

	// ---------- assorted code ----------

	qwerty = ["q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x","c","v","b","n","m"];

	function createPre(classes){
		if($("pre."+classes).length === 0){
			$("body").append("<pre class='"+classes.replace(/\./g, " ")+"'>");
			$("pre.server").hide();
			$("pre.server.channel."+location.pathname.split("/")[1]+".messages").show();
		}
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
	
	function convertToChan(keypressed){
		if(keypressed == "0"){
			return 9;
		} else if(keypressed < 10){
			return keypressed-1;
		} else {
			return $.inArray(keypressed, qwerty)+10;
		}
	}

	jwerty.key('↑,↑,↓,↓,←,→,←,→,B,A,↩', function(){alert("yaaaaaaaaaaay!");});

});