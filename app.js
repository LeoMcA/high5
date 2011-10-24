// ---------- express stuff ----------

var express = require("express");
var app = module.exports = express.createServer();

app.configure(function() {
	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + "/public"));
});

app.configure("development", function() {
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

app.configure("production", function() {
	app.use(express.errorHandler());
});

app.get("/", function(req, res) {
	res.render("index", {
		title: "Express"
	});
});

app.get("/:channel", function(req, res) {
	res.render("index", {
		title: "Express"
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// ---------- socket.io stuff ----------

var io = require("socket.io").listen(app);

// ---------- redis stuff ----------

var redis = require('redis').createClient();

io.sockets.on("connection", function(){
	chanlist.forEach(function(channel){
		if(channel == "server"){
			
		} else {
			redis.lrange("server.channel."+channel+".messages", "0", "-1", function(err, data){
				data.forEach(function(msg){
					io.sockets.emit("ircServerMsg", {
						"to": channel,
						"msg": msg
					});
				});
			});
		}
	});
});

// ---------- irc stuff ----------

var irc = require("irc");
var client = new irc.Client("irc.mozilla.org", "leo|high5", {
	userName: "high5",
	realName: "high5 IRC client",
	port: 6667,
	debug: true,
	showErrors: true,
	autoRejoin: true,
	autoConnect: true,
	channels: ["#high5"],
	secure: false,
	selfSigned: false,
	floodProtection: false
});

// stuff to do with messages to the irc server

io.sockets.on("connection", function(socket){
	socket.on("ircClientMsg", function(data){
		if(chanlist.indexOf(data.to) === -1 || data.to == ""){
			return;
		} else if(data.msg.search(/^\/me/) > -1){
			client.emit("message", client.nick, data.to, data.msg.replace("/me", "\u0001ACTION").replace(/$/, "\u0001"));
			client.say(data.to, data.msg.replace("/me", "\u0001ACTION").replace(/$/, "\u0001"));
		} else if(data.msg.search(/^\/join/) > -1){
			client.join(data.msg.replace("/join ", ""));
		} else if(data.msg.search(/^\/part/) > -1){
			client.part(data.msg.replace("/part ", ""));
		} else if(data.msg.search(/^\/quit/) > -1){
			client.disconnect(data.msg.replace("/quit ", ""));
		} else {
			client.emit("message", client.nick, data.to, data.msg);
			client.say(data.to, data.msg);
		}
	});
});

// chanlist stuff

chanlist = ["server"];

io.sockets.on("connection", function(){
	io.sockets.emit("chanlist", chanlist);
});

function modChanlist(action, nick, channel){
	if(nick == client.nick){
		if(action == "motd"){
		} if(action == "join"){
			chanlist.push(channel);
		} if(action == "part" || action == "kick"){
			chanlist.splice(findInArray(chanlist, channel), 1);
		} if(action == "quit"){
			chanlist = ["server"];
		}
		io.sockets.emit("chanlist", chanlist);
	}
}

// userlist stuff

function modUserlist(action, nick, channel){
	/*if(nick != client.nick){
		if(action == "join"){
			chanlist.push(channel);
		} if(action == "part" || action == "kick"){
			chanlist.splice(findInArray(chanlist, channel), 1);
		} if(action == "quit"){
			chanlist = [];
		}
		io.sockets.emit("chanlist", chanlist);
	}*/
}

// stuff to do with messages from the irc server

function onIrcServerMsg(data){
	addMsgToRedis(data);
	io.sockets.emit("ircServerMsg", data);
}

function addMsgToRedis(data){
	if(data.to == "server"){
		redis.rpush("server.motd", data.msg);
	} else if(Array.isArray(data.to)){
		data.to.forEach(function(value){
			redis.rpush("server.channel."+value+".messages", data.msg);
		});
	} else {
		redis.rpush("server.channel."+data.to+".messages", data.msg);
	}
}

client.addListener("registered", function() {
	/*onIrcServerMsg({
		"type": "registered"
	});*/
});
client.addListener("motd", function(motd) {
	io.sockets.emit("ircNick", client.nick);
	onIrcServerMsg({
		"type": "motd",
		"to": "server",
		"msg": motd
	});
});
client.addListener("names", function(channel, nicks) {
	/*onIrcServerMsg({
		"type": "names",
		"chan": channel,
		"nicks": nicks
	});*/
});
client.addListener("topic", function(channel, topic, nick) {
	//modTopic(topic, channel, nick);
	onIrcServerMsg({
		"type": "topic",
		"to": channel,
		"msg": "<-> "+nick+" changed the topic to \""+topic+"\"\n",
	});
});
client.addListener("join", function(channel, nick) {
	modUserlist("join", nick, channel);
	modChanlist("join", nick, channel);
	onIrcServerMsg({
		"to": channel,
		"msg": "--> "+nick+" joined "+channel+"\n"
	});
});
client.addListener("part", function(channel, nick, reason) {
	modUserlist("part", nick, channel);
	modChanlist("part", nick, channel);
	onIrcServerMsg({
		"to": channel,
		"msg": "<-- "+nick+" left "+channel+" ("+reason+")\n"
	});
});
client.addListener("quit", function(nick, reason, channels) {
	modUserlist("quit", nick);
	modChanlist("quit", nick);
	onIrcServerMsg({
		"to": channel,
		"msg": "<-- "+nick+" left irc ("+reason+")\n"
	});
});
client.addListener("kick", function(channel, nick, by, reason) {
	modUserlist("kick", nick, channel);
	modChanlist("kick", nick, channel);
	onIrcServerMsg({
		"to": channel,
		"msg": "<-- "+nick+" was kicked from "+channel+" by "+by+" ("+reason+")\n"
	});
});
client.addListener("message", function(nick, to, text) {
	if(text.search(/^\x01ACTION/) > -1){
		onIrcServerMsg({
			"to": to,
			"msg": text.replace("\x01ACTION", "*"+nick).replace("\x01", "")+"\n"
		});
	} else {
		onIrcServerMsg({
			"to": to,
			"msg": "<"+nick+"> "+text+"\n"
		});
	}
});
client.addListener("notice", function(nick, to, text) {
	/*onIrcServerMsg({
		"type": "message",
		"nick": nick,
		"to": to,
		"text": convertToEntity(text)
	});*/
});
client.addListener("nick", function(oldnick, newnick, channels) {
	modUserlist("nick", newnick, channels, oldnick);
	onIrcServerMsg({
		"type": "nick",
		"to": channels,
		"msg": oldnick+" is now known as "+newnick+"\n"
	});
});
client.addListener("invite", function(channel, from) {
	/*onIrcServerMsg({
		"type": "invite",
		"channel": channel,
		"from": from
	});*/
});
client.addListener("whois", function(info) {
	/*onIrcServerMsg({
		"type": "whois",
		"info": info
	});*/
});

// ---------- misc functions ----------

function findInArray(array, str){
	position = array.forEach(function(value, index){
		if(value == str){
			return index;
		} else {
			return false;
		}
	});
	return position;
}