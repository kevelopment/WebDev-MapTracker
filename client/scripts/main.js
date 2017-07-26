const mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
const fetch = require("node-fetch");
// url zu server um daten abzufangen
const serverUrl = "http://localhost:8080/track";
/*
 * GMAPS vars:
 * mapAPI = google.map Objekt (zum erstellen von PolyLine & Markern)
 * map = google.map.Map Objekt (karte an sich)
 * coordinates = koordinaten {lat, lng} des aktuell gezeichneten tracks
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
 * lastTrack = li des zuletzt angeklickten tracks
 */
var tracks = [];
var lastTrack = null;

/*
 * Pagination vars:
 * pages => nr of pages in total
 * currPage => current Page index
 * nrTracks => nr of tracks per page
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
		// koordinaten für trier setzen
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		// globales objekt für google maps api setzen
		mapAPI = maps;
		// Karte laden und als einstiegspunkt auf Trier setzen
		map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
	}
);

/*
 * onload: bei laden der Seite, GET request per fetch an Server schicken
 * und Daten der Tracks {trackID: int, trackName: String} in var tracks speichern
 */
window.onload = function () {
	// über fetch api get requests an server senden
	fetch(serverUrl)
		.then(function (res) {
			// check, ob status 200 und content-type = application/json => res.json() weitergeben
			if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
				return res.json();
			}
			else {
				// falls nicht zulässig, fehler werfen
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
				// < und > zum inc/dec des Seiten zählers initialisieren
				var incPageLi = document.getElementById("inc");
				var decPageLi = document.getElementById("dec");
				incPageLi.addEventListener("click", () => { incrementPage(); });
				decPageLi.addEventListener("click", () => { decrementPage(); });
			}
		}).catch(function (error) {
			// falls status code & content-type nicht passen: fehler abfangen
			console.error(error.message);
		});
};

/*
 * bei verändern der Fenstergröße: Pagination aktualisieren + track auf map zentrieren
 */
window.onresize = function () {
	fillTracks();
	fitMap();
};

/* 
 * onClick() methode für alle Tracks:
 * 	- visualisiere klick durch farbe
 * 	- frage bei server daten zu track an
 * 	- zeichne track auf karte
 * 	- zeichne höhenprofil des tracks
 */
function onClick() {
	// setze farbe zurück, falls vorher schon ein track angeklickt war
	if (lastTrack !== null) {
		lastTrack.style.backgroundColor = "";
	}
	lastTrack = this;
	// setze farbe des geklickten tracks
	this.style.backgroundColor = activeColor;
	// Daten vom Server beziehen über fetch 
	fetch(serverUrl + "/" + this.id, { method: "GET" })
		.then(function (res) {
			// falls status = 200 und content-type = json: json objekt aus response erzeugen
			if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
				return res.json();
			}
			// sonst: TypeError erstellen
			else {
				throw new TypeError("Unexpected content-type");
			}
		}).then(function (json) {
			// json daten aus response weiter verarbeiten: track & höhenprofil zeichnen
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
 * zeichnen des höhengraphen
 */
function drawHeightProfile(json) {
	let entries = json.features[0].geometry.coordinates;

	var canvas = document.getElementById("heightGraph");
	var ctx = canvas.getContext("2d");

	var width = ctx.canvas.width;
	var height = ctx.canvas.height;
	ctx.clearRect(0, 0, width, height);

	var max = -1;
	var min = 10000;
	for (var data in entries) {
		max = Math.max(max, entries[data][2]);
		min = Math.min(min, entries[data][2]);
	}

	var widthScale = ctx.canvas.width / entries.length;
	var heightScale = ctx.canvas.height / max;

	ctx.lineWidth = widthScale;
	ctx.beginPath();
	ctx.moveTo(0, height);

	for (var index = 0; index < entries.length; index++) {
		var trackHeight = entries[index][2];
		if (max - min < height / 2) {
			ctx.lineTo(index * widthScale, height - (trackHeight * heightScale) + (height / 2));
		}
		else {
			ctx.lineTo(index * widthScale, height - (trackHeight * heightScale) + 10);
		}
	}

	ctx.lineTo(width, height);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

/*
 * zeichnet @json Objekt auf die Karte
 */ 
function drawOnMap(json) {
	// entries = geo-json koordinaten
	let entries = json.features[0].geometry.coordinates;

	// falls noch ein gezeichneter pfad existiert: entfernen
	if (trackPath) {
		trackPath.setMap(null);
	}

	// koordinaten für gmaps API vorbereiten
	coordinates = [];
	for (var i in entries) {
		coordinates.push({ lat: entries[i][1], lng: entries[i][0] });
	}

	// vorherige marker entfernen,falls vorhanden
	if (startMarker !== null) {
		startMarker.setMap(null);
		startMarker = null;
	}
	if (endMarker !== null) {
		endMarker.setMap(null);
		endMarker = null;
	}
	// marker für start bzw ende auf karte setzen
	setMarkers(entries);

	// linie anhand des tracks zeichnen
	trackPath = new mapAPI.Polyline({
		path: coordinates,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	// karte zentrieren und zoomen
	fitMap();
	// track auf karte zeichnen 
	trackPath.setMap(map);
}

/*
 * Zentriert die Karte auf dem aktuellen Track
 */ 
function fitMap() {
	if (trackPath) {
		// bounds des aktuellen tracks berechnen (über maps api)
		var bounds = new mapAPI.LatLngBounds();

		trackPath.getPath().forEach(function (e) {
			bounds.extend(e);
		});
		// bounds auf karte zentrieren
		map.fitBounds(bounds);
	}
}

/*
 * Berechnet die Anzahl der Tracks/Seite, die angezeigt werden
 * und füllt ul mit den tracks als li
 */
function fillTracks() {
	// <ul> für einträge beziehen
	var trackList = document.getElementById("tracks");
	// einträge von ul resetten
	trackList.innerHTML = "";

	// li zur berechnung der größe reservieren
	var li;
	// höhe des fensters + des nav bereichs 
	var winHeight = document.getElementById("trackSelector").offsetHeight;
	var navHeight = document.getElementById("controls").offsetHeight;
	// li zur berechnung der größe erstellen
	li = document.createElement("li");
	li.innerHTML = tracks[0].trackName;
	trackList.appendChild(li);
	// größe inkl padding berechnen und entfernen
	var liHeight = li.offsetHeight + 16; // + padding top & bottom
	li.parentNode.removeChild(li);
	// höhe der liste berechnen
	var listHeight = winHeight - navHeight - 4;

	// anzahl der einträge pro seite berechnen
	nrOfEntries = Math.floor(listHeight / liHeight);
	// falls höhe der liste kleiner wird als 2 * li => return und belasse liste, wie sie ist
	if (listHeight <= liHeight) {
		nrOfEntries = 1;
	}
	// anzahl der seiten berechnen
	pages = Math.max(1, Math.ceil(tracks.length / nrOfEntries));
	// li zur anzeige der seitenzahlen füllen

	// fix für onresize (falls aktuelle seite > anzahl an seiten => aktuelle seite = letzte seite)
	if (currPage > pages) {
		currPage = pages;
	}
	// falls aktuelle seite < 1, dann setze aktuelle seite = 1
	else if (currPage < 1) {
		currPage = 1;
	}

	var pageLi = document.getElementById("pages");
	pageLi.innerHTML = currPage + " / " + pages;

	// jedes item auf seite als li erstellen + id etc. vergeben
	for (var track = (currPage - 1) * nrOfEntries; track < currPage * nrOfEntries; track++) {
		if (tracks[track] !== undefined) {
			// li mit id = trackID und text = trackName erstellen
			li = document.createElement("li");
			li.setAttribute("class", "tracker-item");
			li.setAttribute("id", tracks[track].trackID);
			li.innerHTML = tracks[track].trackName;
			// EventListener für onClick setzen
			li.addEventListener("click", onClick, false);
			// angeklickter track soll auch in pagination dunkel hinterlegt werden/bleiben
			if (lastTrack !== null && lastTrack.innerHTML === tracks[track].trackName) {
				li.style.backgroundColor = activeColor;
				lastTrack = li;
			}
			// li der liste hinzufügen
			trackList.appendChild(li);
		}
	}
}

/*
 * setze marker für start und ende auf map für angeklickten track
 */
function setMarkers(entries) {
	// bestimme start und ende koordinaten (gmaps konform)
	var start = { lat: entries[0][1], lng: entries[0][0] };
	var end = { lat: entries[entries.length - 1][1], lng: entries[entries.length - 1][0] };

	// falls start = end koordinate => erstelle nur einen marker
	if (entries[0][1] === entries[entries.length - 1][1] && entries[0][0] === entries[entries.length - 1][0]) {
		startMarker = new mapAPI.Marker({
			position: start,
			map: map,
			label: "S",
			title: "Track Start!"
		});
	}
	// sonst: erstelle 2 marker (start & end)
	else {
		// add start and end markers
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

// aktuelle Seite inkrementieren und track-liste aktualisieren
function incrementPage() {
	if (currPage < pages) {
		currPage++;
	}
	fillTracks();
}

// aktuelle Seite dekrementieren und track-liste aktualisieren
function decrementPage() {
	if (currPage > 1) {
		currPage--;
	}
	fillTracks();
}
