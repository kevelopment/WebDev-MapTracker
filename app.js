const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const controller = require("./server/controller");

let app = express();

var PORT = 8080;

if (process.argv.length >= 3) {
	if (!isNaN(process.argv[2])) {
		PORT = process.argv[2];
	}
}

app.use(express.static(path.join(__dirname, "./public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

controller(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error("Not Found");
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
