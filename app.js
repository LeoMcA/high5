var express = require("express@2.4.7");
var curl = require("./lib/curl");
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
	res.render("index", { user: req.session.email });
});


/*app.get("/:channel", function(req, res) {
	res.render("index", {
		title: "Express"
	});
});*/

app.get("/login", function(req, res){
	if(!req.session.email){
		res.render("login", { user: req.session.email });
	} else {
		res.redirect("/");
	}
})

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = require("socket.io").listen(app);

var irc = require("./lib/irc");
var client = {};
var ircConnected = false;

io.sockets.on("connection", function(socket){
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
				"channels": ["#high5", "#lizardlounge"]
			});
			client.on(function(data){
				socket.emit("irc", data);
			});
		}
    })

    if(ircConnected){
	    client.on(function(data){
			socket.emit("irc", data);
		});
	}

	socket.on("irc", function(data){
		client.send(data);
	});
});