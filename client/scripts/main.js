const mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
const fetch = require("node-fetch");
// url zu server um daten abzufangen
const serverUrl = "http://localhost:8080/track";
/*
 * GMAPS vars:
 * mapAPI = google.map Objekt (zum erstellen von PolyLine & Markern)
 * map = google.map.Map Objekt (Karten-Objekt)
 * coordinates = Koordinaten {lat, lng} des aktuell in Karte gezeichneten Tracks
 * trackPath = google.map.PolyLine Objekt (gezeichnete Linie)
 */
var mapAPI;
var map;
var coordinates;
var trackPath;
var startMarker = null;
var endMarker = null;

/*
 * Pagination vars:
 * tracks = Liste aller Tracks {trackID: int, trackName: String}
 * lastTrack = li des zuletzt angeklickten Tracks
 */
var tracks = [];
var lastTrack = null;

/*
 * Pagination vars:
 * pages => Anzahl Gesamtseiten
 * currPage => aktuelle Seite
 * nrTracks => Anzahl an Tracks pro Seite
*/
var pages;
var currPage;
var nrOfEntries;
const activeColor = "#7CB342";

/*
 * Google Maps API laden + map auf div anzeigen
 */
mapsapi().then(
	function (maps) {
		// Koordinaten für Trier statisch setzen
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		// globale Variable für Google maps API setzen
		mapAPI = maps;
		// Karte laden und als Einstiegspunkt auf Trier setzen
		map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
	}
);

/*
 * onload: bei Laden der Seite, GET request per fetch an Server schicken
 * und Daten der Tracks {trackID: int, trackName: String} in variable tracks speichern
 */
window.onload = function () {
	// über fetch api GET requests an Server senden
	fetch(serverUrl)
		.then(function (res) {
			// check, ob Status 200 und content-type = application/json => res.json() weitergeben
			if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
				return res.json();
			}
			else {
				// falls nicht zulässig, Fehler werfen
				throw new TypeError("418 I'm a teapot");
			}
		}).then(function (json) {
			// Daten aus Server response entnehmen
			if (json) {
				// Daten in tracks speichern
				for (var idx in json) {
					tracks.push(json[idx]);
				}
				// Pagination initialisieren: aktuelle Seite = 1
				currPage = 1;
				// Tracks in ul anzeigen
				fillTracks();
				// < und > zum inc/dec des Seiten zählers initialisieren und EventListener für onClick anmelden
				var incPageLi = document.getElementById("inc");
				var decPageLi = document.getElementById("dec");
				incPageLi.addEventListener("click", () => { incrementPage(); });
				decPageLi.addEventListener("click", () => { decrementPage(); });
			}
		}).catch(function (error) {
			// falls Status code & content-type nicht passen: Fehler abfangen
			console.error(error.message);
		});
};

/*
 * bei Verändern der Fenstergröße: Pagination aktualisieren + Track auf map zentrieren
 */
window.onresize = function () {
	fillTracks();
	fitMap();
};

/* 
 * onClick() Methode für alle Tracks:
 * 	- visualisiere Klick durch Hintergrundfarbe des li
 * 	- Anfrage der Daten des angeklickten Tracks bei Server
 * 	- zeichne Track auf Karte über Polyline
 * 	- zeichne Höhenprofil des Tracks in Canvas
 */
function onClick() {
	// setze Farbe zurück, falls vorher schon ein Track angeklickt war
	if (lastTrack !== null) {
		lastTrack.style.backgroundColor = "";
	}
	lastTrack = this;
	// setze Farbe des geklickten Tracks
	this.style.backgroundColor = activeColor;
	// Daten vom Server beziehen über fetch 
	fetch(serverUrl + "/" + this.id, { method: "GET" })
		.then(function (res) {
			// falls Status = 200 und content-type = json: JSON-Objekt aus response erzeugen und weitergeben
			if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
				return res.json();
			}
			// sonst: TypeError erstellen
			else {
				throw new TypeError("Unexpected content-type");
			}
		}).then(function (json) {
			// JSON-Daten aus response weiter verarbeiten: Track & Höhenprofil einzeichnen
			if (json) {
				drawOnMap(json);
				drawHeightProfile(json);
			}
		}).catch(function (err) {
			// TypeError abfangen und ausgeben
			console.error(err.message);
		});
}

/*
 * Methode zum zeichnen des höhengraphen anhand von Daten in JSON-Objekt
 */
function drawHeightProfile(json) {
	// Daten aus JSON-Objekt auslesen
	let entries = json.features[0].geometry.coordinates;
	// Canvas aus HTML beziehen und Context initialisieren
	var canvas = document.getElementById("heightGraph");
	var ctx = canvas.getContext("2d");
	// Breite und Höhe des Canvas abfragen
	var width = ctx.canvas.width;
	var height = ctx.canvas.height;
	// Canvas resetten
	ctx.clearRect(0, 0, width, height);
	// Höchste und Niedrigste Koordinate aus Tracks entnehmen
	var max = -1;
	var min = 10000;
	for (var data in entries) {
		max = Math.max(max, entries[data][2]);
		min = Math.min(min, entries[data][2]);
	}
	// Höhen- und Breitenskalierung berechnen
	var widthScale = width / entries.length;
	var heightScale = height / max;
	// Höhengraph als Linie zeichnen
	ctx.lineWidth = widthScale;
	ctx.beginPath();
	// bei Koordinate 0, canvas.heigh (Nullpunkt) starten 
	ctx.lineTo(0, height);
	// durch alle Einträge laufen und Koordinate skaliert zu Pfad hinzufügen
	for (var index = 0; index < entries.length; index++) {
		var trackHeight = entries[index][2];
		// falls Track keine großen Höhenunterschiede hat => Skalierung anpassen, damit nich zu hoch gezeichnet wird
		if (max - min < height / 2) {
			ctx.lineTo(index * widthScale, height - (trackHeight * heightScale) + (height / 2));
		}
		// sonst: Koordinate normal skaliert einzeichnen
		else {
			ctx.lineTo(index * widthScale, height - (trackHeight * heightScale) + 10);
		}
	}
	// wenn alle Einträge hinzugefügt, abschluss der Linie auf canvas.height, canvas.width setzen
	ctx.lineTo(width, height);
	// Pfad beenden und zusammenführen
	ctx.closePath();
	// Pfad mit farbe (schwarz) füllen
	ctx.fill();
	// Pfad zeichnen
	ctx.stroke();
}

/*
 * zeichnet Koordinaten aus JSON-Objekt auf die Karte
 */ 
function drawOnMap(json) {
	// entries = geo-json koordinaten
	let entries = json.features[0].geometry.coordinates;

	// falls noch ein gezeichneter Pfad existiert: entfernen
	if (trackPath) {
		trackPath.setMap(null);
	}

	// Koordinaten für Google maps API vorbereiten
	coordinates = [];
	for (var i in entries) {
		coordinates.push({ lat: entries[i][1], lng: entries[i][0] });
	}

	// Linie anhand der Koordinaten eines Tracks vorbereiten
	trackPath = new mapAPI.Polyline({
		path: coordinates,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	// Track auf Karte zeichnen 
	trackPath.setMap(map);
	// Marker für Start bzw Ende auf Karte setzen
	setMarkers(entries);
	// Karte zentrieren und zoomen
	fitMap();
	// fix für Marker, die manchmal nicht angezeigt werden: erst rein zoomen, dann raus zoomen
	map.setZoom(map.getZoom() - 1);
	map.setZoom(map.getZoom() + 1);
}

/*
 * Zentriert die Karte auf dem aktuellen Track
 */ 
function fitMap() {
	if (trackPath) {
		// bounds des aktuellen Tracks berechnen (über maps api)
		var bounds = new mapAPI.LatLngBounds();

		trackPath.getPath().forEach(function (e) {
			bounds.extend(e);
		});
		// bounds auf Karte zentrieren
		map.fitBounds(bounds);
	}
}

/*
 * Berechnet die Anzahl der Tracks/Seite, die angezeigt werden
 * und füllt ul mit den Tracks als li
 */
function fillTracks() {
	// <ul> für Einträge beziehen
	var trackList = document.getElementById("tracks");
	// Einträge von ul resetten
	trackList.innerHTML = "";

	// dummy-li zur Berechnung der Größe erstellen
	var li;
	// Höhe des Fensters + des nav Bereichs nehmen
	var winHeight = document.getElementById("trackSelector").offsetHeight;
	var navHeight = document.getElementById("controls").offsetHeight;
	// li zur Berechnung der Dimensionen aller Track-Einträge erstellen
	li = document.createElement("li");
	li.innerHTML = tracks[0].trackName;
	trackList.appendChild(li);
	// Größe inkl padding berechnen und li wieder entfernen
	var liHeight = li.offsetHeight + 16; // + padding top & bottom
	li.parentNode.removeChild(li);
	// Höhe der Liste berechnen
	var listHeight = winHeight - navHeight - 4;

	// Anzahl der Einträge pro Seite berechnen
	nrOfEntries = Math.floor(listHeight / liHeight);
	// falls Höhe der liste kleiner wird als li => belasse liste, wie sie ist (min 1 li wird angezeigt)
	if (listHeight <= liHeight) {
		nrOfEntries = 1;
	}
	// Anzahl der Seiten berechnen
	pages = Math.max(1, Math.ceil(tracks.length / nrOfEntries));

	// fix für onresize (falls aktuelle Seite > Anzahl an seiten => aktuelle Seite = letzte Seite)
	if (currPage > pages) {
		currPage = pages;
	}
	// falls aktuelle Seite < 1, dann setze aktuelle Seite = 1
	else if (currPage < 1) {
		currPage = 1;
	}

	// li zur Anzeige der Seitenzahlen füllen
	var pageLi = document.getElementById("pages");
	pageLi.innerHTML = currPage + " / " + pages;

	// jeden Eintrag in Liste als li erstellen + id etc. vergeben
	for (var track = (currPage - 1) * nrOfEntries; track < currPage * nrOfEntries; track++) {
		if (tracks[track] !== undefined) {
			// li mit id = trackID und text = trackName erstellen
			li = document.createElement("li");
			li.setAttribute("class", "tracker-item");
			li.setAttribute("id", tracks[track].trackID);
			li.innerHTML = tracks[track].trackName;
			// EventListener für onClick setzen
			li.addEventListener("click", onClick, false);
			// angeklickter Track soll auch in pagination dunkel hinterlegt werden/bleiben
			if (lastTrack !== null && lastTrack.innerHTML === tracks[track].trackName) {
				li.style.backgroundColor = activeColor;
				lastTrack = li;
			}
			// li der Liste hinzufügen
			trackList.appendChild(li);
		}
	}
}

/*
 * setze Marker für Start und Ende auf map für ausgewählten Track
 */
function setMarkers(entries) {
	// bestimme Start und Ende Koordinaten (gmaps konform)
	var start = { lat: entries[0][1], lng: entries[0][0] };
	var end = { lat: entries[entries.length - 1][1], lng: entries[entries.length - 1][0] };

	// vorherige Marker entfernen,falls vorhanden
	if (startMarker !== null) {
		startMarker.setMap(null);
		startMarker = null;
	}
	if (endMarker !== null) {
		endMarker.setMap(null);
		endMarker = null;
	}

	// falls Start = Ende Koordinate => erstelle nur einen Marker
	if (entries[0][1] === entries[entries.length - 1][1] && entries[0][0] === entries[entries.length - 1][0]) {
		startMarker = new mapAPI.Marker({
			position: start,
			map: map,
			label: "S",
			title: "Track Start!"
		});
	}
	// sonst: erstelle 2 Marker (Start & Ende)
	else {
		startMarker = new mapAPI.Marker({
			position: start,
			map: map,
			label: "S",
			title: "Track Start!"
		});

		endMarker = new mapAPI.Marker({
			position: end,
			map: map,
			label: "E",
			title: "Track End!"
		});
	}
}

// aktuelle Seite inkrementieren und Trackliste aktualisieren
function incrementPage() {
	if (currPage < pages) {
		currPage++;
	}
	fillTracks();
}

// aktuelle Seite dekrementieren und Trackliste aktualisieren
function decrementPage() {
	if (currPage > 1) {
		currPage--;
	}
	fillTracks();
}
