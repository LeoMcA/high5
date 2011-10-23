var express = require("express");
var app = module.exports = express.createServer();
var irc = require("irc");
var io = require("socket.io").listen(app);
chanlist = [];

// Configuration
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

// Routes
app.get("/", function(req, res) {
	res.render("index", {
		title: "Express"
	});
});

app.get("/server/:channel", function(req, res) {
	res.render("index", {
		title: "Express"
	});
});

app.listen(process.env.C9_PORT);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// WebSockets stuff
io.sockets.on("connection", function() {
	//client.connect();
	io.sockets.emit("chanlist", chanlist);
});

io.sockets.on("disconnect", function() {
	//client.disconnect();
});

function ioSend(data) {
	io.sockets.emit("irc", data);
}

// IRC stuff
function findInArray(array, str){
	position = array.forEach(function(value, index){
		if(value === str){
			return index;
		} else {
			return false;
		}
	});
	return position;
}

function modChanlist(action, nick, channel){
	if(nick == "leo|high5"){
		if(action == "motd"){
		} if(action == "join"){
			chanlist.push(channel);
		} if(action == "part" || action == "kick"){
			chanlist.splice(findInArray(chanlist, channel), 1);
		} if(action == "quit"){
			chanlist = [];
		}
		io.sockets.emit("chanlist", chanlist);
	}
}
var client = new irc.Client("irc.mozilla.org", "leo|high5", {
	userName: "high5",
	realName: "high5 IRC client",
	port: 6667,
	debug: false,
	showErrors: false,
	autoRejoin: true,
	autoConnect: true,
	channels: ["#high5", "#high52"],
	secure: false,
	selfSigned: false,
	floodProtection: false
});

client.addListener("registered", function() {
	ioSend({
		"type": "registered"
	});
});
client.addListener("motd", function(motd) {
	ioSend({
		"type": "motd",
		"motd": motd
	});
});
client.addListener("names", function(channel, nicks) {
	ioSend({
		"type": "names",
		"channel": channel,
		"nicks": nicks
	});
});
client.addListener("topic", function(channel, topic, nick) {
	ioSend({
		"type": "topic",
		"channel": channel,
		"topic": topic,
		"nick": nick
	});
});
client.addListener("join", function(channel, nick) {
	modChanlist("join", nick, channel);
	ioSend({
		"type": "join",
		"channel": channel,
		"nick": nick
	});
});
client.addListener("part", function(channel, nick, reason) {
	modChanlist("part", nick, channel);
	ioSend({
		"type": "part",
		"channel": channel,
		"nick": nick,
		"reason": reason
	});
});
client.addListener("quit", function(nick, reason, channels) {
	modChanlist("quit", nick);
	ioSend({
		"type": "quit",
		"nick": nick,
		"reason": reason,
		"channels": channels
	});
});
client.addListener("kick", function(channel, nick, by, reason) {
	modChanlist("kick", nick, channel);
	ioSend({
		"type": "kick",
		"channel": channel,
		"nick": nick,
		"by": by,
		"reason": reason
	});
});
client.addListener("message", function(nick, to, text) {
	ioSend({
		"type": "message",
		"nick": nick,
		"to": to,
		"text": text
	});
});
client.addListener("notice", function(nick, to, text) {
	ioSend({
		"type": "notice",
		"nick": nick,
		"to": to,
		"text": text
	});
});
client.addListener("nick", function(oldnick, newnick, channels) {
	ioSend({
		"type": "nick",
		"oldnick": oldnick,
		"newnick": newnick,
		"channels": channels
	});
});
client.addListener("invite", function(channel, from) {
	ioSend({
		"type": "invite",
		"channel": channel,
		"from": from
	});
});
client.addListener("whois", function(info) {
	ioSend({
		"type": "whois",
		"info": info
	});
});