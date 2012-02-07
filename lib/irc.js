var ircLib = require("irc");

exports.client = irc = function(config){
	this.client = new ircLib.Client(config.server, config.nick, {
		userName: "high5",
		realName: "high5 IRC client",
		port: config.port,
		debug: true,
		showErrors: true,
		autoRejoin: true,
		autoConnect: true,
		channels: config.channels,
		secure: false,
		thisSigned: false,
		stripColors: true,
		floodProtection: false
	});
}

irc.prototype.connect = function(){
	this.client.connect();
}

irc.prototype.disconnect = function(){
	this.client.disconnect();
}

irc.prototype.getChans = function(){
	var channels = [];
	for(var chan in this.client.chans){
		console.log(chan);
		channels.push(chan);
	}
	return channels;
}

irc.prototype.sendNames = function(data){
	if(data.nick == this.client.nick) {
		return false;
	} else if(data.type == "quit"){
		data.chans.forEach(function(val){
			this.client.send("NAMES", val);
		});
	} else {
		this.client.send("NAMES", data.chan);
	}
}

irc.prototype.setNick = function(data){
	if(this.client.nick == data.oldnick) this.client.nick = data.newnick;
}

irc.prototype.on = function(callback){
	this.client.addListener("motd", function(motd) {
		var date = new Date();
		callback({
			"type": "motd",
			"date": date,
			"motd": motd
		});
	});
	this.client.addListener("names", function(channel, nicks) {
		var date = new Date();
		var ops = [];
		var hops = [];
		var voices = [];
		var users = [];
		var all = [];
		for(var nick in nicks){
			if(nicks[nick].search(/@/) > -1) ops.push(nick);
			else if(nicks[nick].search(/%/) > -1) hops.push(nick);
			else if(nicks[nick].search(/\+/) > -1) voices.push(nick);
			else users.push(nick);
			all.push(nick);
		}
		callback({
			"type": "names",
			"date": date,
			"chan": channel,
			"nicks": {
				"ops": ops,
				"hops": hops,
				"voices": voices,
				"users": users,
				"all": all
			}
		});
	});
	this.client.addListener("topic", function(channel, topic, nick) {
		var date = new Date();
		callback({
			"type": "topic",
			"date": date,
			"chan": channel,
			"nick": nick,
			"topic": topic
		});
	});
	this.client.addListener("join", function(channel, nick) {
		var date = new Date();
		callback({
			"type": "join",
			"date": date,
			"chan": channel,
			"nick": nick
		});
	});
	this.client.addListener("part", function(channel, nick, reason) {
		var date = new Date();
		callback({
			"type": "part",
			"date": date,
			"chan": channel,
			"nick": nick,
			"reason": reason
		});
	});
	this.client.addListener("quit", function(nick, reason, channels) {
		var date = new Date();
		callback({
			"type": "quit",
			"date": date,
			"chans": channels,
			"nick": nick,
			"reason": reason
		});
	});
	this.client.addListener("kick", function(channel, nick, by, reason) {
		var date = new Date();
		callback({
			"type": "kick",
			"date": date,
			"chan": channel,
			"nick": nick,
			"by": by,
			"reason": reason
		});
	});
	this.client.addListener("message", function(nick, to, text) {
		var date = new Date();
		if(to.search(/^[#\&]/) > -1){
			if(text.search(/^\x01ACTION/) > -1){
				callback({
					"type": "action",
					"date": date,
					"chan": to,
					"nick": nick,
					"action": text.replace("\x01ACTION ", "").replace("\x01", "")
				});
			} else {
				callback({
					"type": "msg",
					"date": date,
					"chan": to,
					"nick": nick,
					"msg": text
				});
			}
		} else {
			if(text.search(/^\x01ACTION/) > -1){
				callback({
					"type": "pm-action",
					"date": date,
					"to": to,
					"nick": nick,
					"action": text.replace("\x01ACTION ", "").replace("\x01", "")
				});
			} else {
				callback({
					"type": "pm",
					"date": date,
					"to": to,
					"nick": nick,
					"msg": text
				});
			}
		}
	});
	this.client.addListener("notice", function(nick, to, text) {
		var date = new Date();
		callback({
			"type": "notice",
			"date": date,
			"nick": nick,
			"to": to,
			"notice": text
		});
	});
	this.client.addListener("nick", function(oldnick, newnick, channels) {
		var date = new Date();
		callback({
			"type": "nick",
			"date": date,
			"chans": channels,
			"oldnick": oldnick,
			"newnick": newnick
		});
	});
	this.client.addListener("invite", function(channel, from) {
		var date = new Date();
		callback({
			"type": "invite",
			"date": date,
			"chan": channel,
			"from": from
		});
	});
	this.client.addListener("whois", function(info) {
		var date = new Date();
		callback({
			"type": "whois",
			"date": date,
			"info": info
		});
	});
	this.client.addListener("+mode", function(channel, by, mode, argument) {
		var date = new Date();
		callback({
			"type": "+mode",
			"date": date,
			"chan": channel,
			"by": by,
			"mode": mode,
			"arg": argument
		});
	});
	this.client.addListener("-mode", function(channel, by, mode, argument) {
		var date = new Date();
		callback({
			"type": "-mode",
			"date": date,
			"chan": channel,
			"by": by,
			"mode": mode,
			"arg": argument
		});
	});
}

irc.prototype.send = function(data, quitCallback){
	var split = data.input.split(" ");
	var split1 = data.input.replace(split[0], "").replace(/^ /, "");
	var split2 = data.input.replace(split[0]+" "+split[1], "").replace(/^ /, "");
	var split3 = data.input.replace(split[0]+" "+split[1]+" "+split[2], "").replace(/^ /, "");
	if(data.input.search(/^\/topic/i) > -1){
		if(split[1]){
			if(split[1].search(/^#/) == -1){
				this.client.send("TOPIC", data.activeChan, split1);
			} else {
				this.client.send("TOPIC", split[1], split2);
			}
		} else {
			this.client.send("TOPIC", data.activeChan);
		}
	} else if(data.input.search(/^\/join/i) > -1){
		if(split[1]) this.client.send("JOIN", split[1], split[2]);
		else this.client.send("JOIN", data.activeChan);
	} else if(data.input.search(/^\/part/i) > -1){
		if(split[1]){
			if(split[1].search(/^#/) == -1){
				this.client.send("PART", data.activeChan, split1);
			}
			else {
				this.client.send("PART", split[1], split2);	
			}
		} else {
			this.client.send("PART", data.activeChan);
		}
	} else if(data.input.search(/^\/quit/i) > -1){
		this.client.emit("quit", this.client.nick, split1, this.getChans());
		this.client.disconnect(split1);
		quitCallback();
	} else if(data.input.search(/^\/kick/i) > -1){
		if(split[1].search(/^#/) == -1) this.client.send("KICK", data.activeChan, split[1], split2);
		else this.client.send("KICK", split[1], split[2], split3);
	} else if(data.input.search(/^\/me/i) > -1){
		this.client.emit("message", this.client.nick, data.activeChan, data.input.replace("/me ", "\x01ACTION ").replace(/$/, "\x01"));
		this.client.action(data.activeChan, data.input.replace("/me ", ""));
	} else if(data.input.search(/^\/away/i) > -1){
		//TODO: tell the client it's away
		this.client.send("AWAY", split1);
	} else if(data.input.search(/^\/invite/i) > -1){
		if(!split[2]) this.client.send("INVITE", split[1], data.activeChan);
		else this.client.send("INVITE", split[1], split[2]);
	} else if(data.input.search(/^\/mode/i) > -1){
		if(split[1].search(/^#/) == -1) this.client.send("MODE", data.activeChan, split[1], split[2]);
		else this.client.send("MODE", split[1], split[2], split[3]);
	} else if(data.input.search(/^\/nick/i) > -1){
		this.client.send("NICK", split[1]);
	} else {
		this.client.emit("message", this.client.nick, data.activeChan, data.input);
		this.client.say(data.activeChan, data.input);
	}
}