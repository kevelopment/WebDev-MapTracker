const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const controller = require("./server/controller");

let app = express();
// default PortNr = 8080
var PORT = 8080;

// falls Port in Kommandozeile übergeben wurde
if (process.argv.length > 2) {
	// prüfe ob zulässig (Zahl)
	if (!isNaN(process.argv[2])) {
		// setze Port
		PORT = process.argv[2];
	}
}

app.use(express.static(path.join(__dirname, "./public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

controller(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error("Track Not Found");
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.send(JSON.stringify(err));
});

// Starte Server an Port PORT
app.listen(PORT, () =>
	console.log("Server started on Port %d...", PORT)
);
