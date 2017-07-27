const path = require("path");
const fs = require("fs");
const dataPath = (path.join(__dirname, "./data"));

/*
 * Utility Klasse für den Server um Daten aus /data Verzeichnis zu lesen
 * Zugriffe auf Daten hier synchron, da bei Testen auf localhost kein großer Traffic
 * sollte für größere Zahlen an parallelen Anfragen ggf. zu asynchronem Laden geändert werden
 */

/*
 * Daten aus Verzeichnis /data lesen und als assoziatives Array {trackID: int, trackName: String} zurückgeben
 */
exports.getTrackNames = function () {
	let trackNames = [];
	// synchrones Laden der Daten aus /data
	fs.readdirSync(dataPath).forEach((file) => {
		// für jede Datei: Dateinamen auslesen und als trackID, sowie Name des tracks als trackName speichern
		let content = fs.readFileSync(path.join(dataPath, file));
		let id = file.split(".")[0];
		let json = JSON.parse(content);
		// zusammengebaute Daten in trackNames speichern
		trackNames.push({ trackID: id, trackName: json.features[0].properties.name });
	});
	return trackNames;
};

/*
 * Prüfen, ob angefragte trackID zu einer vorhandenen Datei existriert
 */
exports.trackExists = function (trackID, trackNames) {
	// durchlaufe trackNames
	for (var index = 0; index < trackNames.length; index++) {
		// prüfe, ob übergebe trackID in Array vorhanden
		if (trackNames[index].trackID === trackID) {
			return true;
		}
	}
	return false;
};

/*
 * String des Namens eines Tracks zurückliefern, falls dieser existiert
 */
exports.getTrackName = function (trackID, trackNames) {
	// falls track nicht vorhanden, gebe null zurück
	if (!this.trackExists(trackID, trackNames)) {
		return null;
	}
	// falls track vorhanden gebe track als JSON-Objekt zurück
	else {
		let content = fs.readFileSync(path.join(dataPath, trackID + ".json"));
		let json = JSON.parse(content);
		return json;
	}
};
