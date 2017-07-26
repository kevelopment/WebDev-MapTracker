var trackNames;
let trackReader = require("./trackReader");

module.exports = function (app) {
	// assoziatives Array mit { trackID: int, trackName: String } aus trackReader beziehen
	trackNames = trackReader.getTrackNames();

	// bei GET /track => trackNames als JSON Objekt an client senden
	app.get("/track", function (req, res) {
		res.json(trackNames);
	});

	// bei GET /track/:id prüfen, ob Daten zum angefragten Track existieren und als JSON-Objekt zurück senden
	app.get("/track/:id", function (req, res) {
		var trackID = req.params.id;
		var data = trackReader.getTrackName(trackID, trackNames);
		if (!data) {
			// falls requested track nicht existiert, Fehler werfen und an Client senden
			var err = new Error();
			err.status = 500;
			err.message = "501 Track not Available";
			res.send(err.message);
		}
		else {
			// falls track existiert, diesen als JSON-Objekt versenden
			res.json(data);
		}
	});
};
