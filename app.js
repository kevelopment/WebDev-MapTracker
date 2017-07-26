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

// statisch dateien aus /public an Client senden
app.use(express.static(path.join(__dirname, "./public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// controller behandelt zulässige Anfragen
controller(app);

// unzulässige Anfragen z.B. GET /abc abfangen und behandeln
app.use(function (req, res, next) {
	// Error mit status und fehlermeldung erstellen
	var err = new Error();
	err.status = 501;
	err.message = "501 Not Implemented";
	// an error handler weitergeben
	next(err);
});

// Error handler: Fehler an Client senden
app.use(function (err, req, res) {
	res.status(err.status || 500);
	res.send(err.message);
});

// Starte Server an Port PORT
app.listen(PORT, () =>
	console.log("Server started on Port %d...", PORT)
);
