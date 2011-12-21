var express = require("express");
var curl = require("./curl");
var app = module.exports = express.createServer();

app.configure(function() {
	app.set("views", __dirname + "/../views");
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

app.post("/login", function(req, res){
	if(!req.session.email){
		curl.curl("POST", "assertion="+req.body.assertion+"&audience=http://localhost:3000", "https://browserid.org/verify", function(data){
    		var data = JSON.parse(data);
    		if(data.status != "okay"){
    			res.redirect("/login");
		    } else {
		    	req.session.email = data.email;
		    	res.redirect("/");
		    }
    	});
	} else {
		res.redirect("/");
	}
})

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);