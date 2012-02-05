var express = require("express");
var app = module.exports = express.createServer();

app.configure(function() {
	app.set("views", __dirname + "/views");
	app.set("view engine", "ejs");
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));
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
	res.render("index");
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = require("socket.io").listen(app);

var irc = require("./lib/irc");
var client = {};
var ircConnected = false;

io.sockets.on("connection", function(socket){
	var clientOn = function(data, chans){
		socket.emit("irc", data);
		if(data.type == "join" || data.type == "part" || data.type == "kick" || data.type == "quit" || data.type == "+mode" || data.type == "-mode"){
			socket.emit("ircChans", client.getChans());
			client.sendNames();
		}
	}
	
	socket.emit("connection", {
		"ircConnected": ircConnected
	});
    
    socket.on("connect", function(data){
    	if(!ircConnected){
    		ircConnected = true;
	    	client = new irc.client({
				"server": data.server,
				"port": data.port,
				"nick": data.nick,
				"channels": data.channels.split(/ +|,+/g)
			});
			client.on(clientOn);
		}
    })

    if(ircConnected){
	    client.on(clientOn);
	}

	socket.on("irc", function(data){
		client.send(data, function(){
			ircConnected = false;
			socket.emit("connection", {
				"ircConnected": ircConnected
			});
		});
	});
});