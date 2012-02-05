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

irc.prototype.sendNames = function(){
	if(data.type == "quit"){
		chans.forEach(function(val){
			this.client.send("NAMES", val);
		});
	} else {
		this.client.send("NAMES", data.chan);
	}
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
		if(to.search(/^[\#\&]/) > -1){
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
			var pm = "";
			if(to == this.client.nick){
				pm = nick;
			} else {
				pm = to;
			}
			if(text.search(/^\x01ACTION/) > -1){
				callback({
					"type": "pm-action",
					"date": date,
					"to": to,
					"nick": nick,
					"pm": pm,
					"action": text.replace("\x01ACTION ", "").replace("\x01", "")
				});
			} else {
				callback({
					"type": "pm",
					"date": date,
					"to": to,
					"nick": nick,
					"pm": pm,
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
		if(data.input.search(/^\/topic/i) > -1){
			/*callback({
				"type": "topic",
				"chan": channel,
				//"nick": nick,
				"topic": input.replace("/topic ", "")
			});*/
		} else if(data.input.search(/^\/join/i) > -1){
			this.client.join(data.input.replace("/join ", ""));
		} else if(data.input.search(/^\/part/i) > -1){
			this.client.part(data.input.replace("/part ", ""));
		} else if(data.input.search(/^\/quit/i) > -1){
			this.client.emit("quit", this.client.nick, data.input.replace("/quit ", ""), this.getChans());
			this.client.disconnect(data.input.replace("/quit ", ""));
			quitCallback();
		} else if(data.input.search(/^\/kick/i) > -1){
			/*callback({
				"type": "kick",
				"chan": channel,
				"nick": input.replace("/kick ", ""),
				//"by": by,
				"reason": ""
			});*/
		} else if(data.input.search(/^\/me/i) > -1){
			this.client.emit("message", this.client.nick, data.activeChan, data.input.replace(/^/, "\x01ACTION ").replace(/$/, "\x01"));
			this.client.action(data.activeChan, data.input);
		} else {
			this.client.emit("message", this.client.nick, data.activeChan, data.input);
			this.client.say(data.activeChan, data.input);
		}
}