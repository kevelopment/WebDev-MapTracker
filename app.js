const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const controller = require("./server/controller");

let app = express();
// Standardport als 8080 setzen
var PORT = 8080;

// falls Port in Kommandozeile übergeben wurde
if (process.argv.length > 2) {
	// prüfe ob zulässig (Zahl)
	if (!isNaN(process.argv[2])) {
		// überschreibe Standardport
		PORT = process.argv[2];
	}
}

// statisch Dateien aus /public an Client senden
app.use(express.static(path.join(__dirname, "./public")));
// Middleware zum parsen von requests (header, body etc)
app.use(bodyParser.urlencoded({ extended: false }));
// Middleware zum versenden von JSON-Objekten als response
app.use(bodyParser.json());

// controller behandelt zulässige Anfragen
controller(app);

// unzulässige Anfragen z.B. GET /abc abfangen und behandeln
app.use(function (req, res) {
	// Error mit Status und Fehlermeldung erstellen
	var err = new Error();
	err.status = 501;
	err.message = "501 Not Implemented";
	// Error an Client senden
	res.status(err.status || 500);
	res.send(err.message);
});

// Starte Server an Port PORT
app.listen(PORT, () =>
	console.log("Server started on Port %d...", PORT)
);
