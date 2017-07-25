const mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
const fetch = require("node-fetch");

const serverUrl = "http://localhost:8080/getAllTracks";
const trackUrl = "http://localhost:8080/track";
/*
 * GMAPS vars:
 * mapAPI = google.map Objekt (zum erstellen von PolyLine & Markern)
 * map = google.map.Map Objekt (karte an sich)
 * coordinates = koordinaten {lat, lng} des aktuell gezeichneten tracks
 * trackPah = google.map.PolyLine Objekt (gezeichnete Linie)
 */
var mapAPI;
var map;
var coordinates;
var trackPath;
var startMarker = null;
var endMarker = null;

/*
 * Pagination vars
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

/*
 * Google Maps API laden + map auf div anzeigen
 * init koordinaten = trier
 */
mapsapi().then(
	function (maps) {
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		mapAPI = maps;
		map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
		//console.log("MAPS API loaded");
	}
);

// onload: create http get request to init track list
/*
 * onload: bei laden der Seite, GET request per fetch an Server schicken
 * und Daten der Tracks {trackID: int, trackName: String} in var tracks speichern
 */
window.onload = function () {
	fetch(serverUrl)
		.then(function (res) {
			return res.text();
		}).then(function (body) {
			// data aus Server response entnehmen
			var data = JSON.parse(body);
			//console.log(JSON.parse(body));

			// Daten in tracks speichern
			for (var idx in data) {
				tracks.push(data[idx]);
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
	this.style.backgroundColor = "#8BC34A";
	var body = this.id;
	// Daten vom Server beziehen über fetch 
	fetch(trackUrl,
		{ method: "POST", body: JSON.stringify(body) })
		.then(function (res) {
			return res.text();
		}).then(function (body) {
			let json = JSON.parse(body);
			drawOnMap(json);
			drawHeightProfile(json);
		});
}

/*
 * zeichnen des höhengraphen
 */
function drawHeightProfile(json) {
	console.log(json);
	let entries = json.features[0].geometry.coordinates;

	var canvas = document.getElementById("heightGraph");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	console.log(ctx.canvas.width, ctx.canvas.height);
	console.log(entries);
	var max = -1;
	for (var data in entries) {
		if (entries[data][2] > max) {
			max = entries[data][2];
		}
	}
	var lineSize = ctx.canvas.width / entries.length;
	var heightSize = ctx.canvas.height / max;
	console.log(lineSize, max, heightSize);
	ctx.lineWidth = lineSize;
	ctx.beginPath();
	for (var index = 0; index < entries.length; index++) {
		var height = entries[index][2];
		//console.log("HEIGHT: " + height);
		ctx.moveTo(index * lineSize, ctx.canvas.height);
		ctx.lineTo(index * lineSize, ctx.canvas.height - (height * heightSize) + 10);
	}
	ctx.stroke();
	//console.log("HIGHTDONE");
}

/*
 * zeichnet @json Objekt auf die Karte
 */ 
function drawOnMap(json) {
	// entries = geo-json koordinaten
	let entries = json.features[0].geometry.coordinates;

	// falls noch ein gezeichneter pfad existiert: entfernen
	if (trackPath !== undefined) {
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
	if (trackPath !== null) {
		// bounds des aktuellen tracks berechnen (über maps api)
		var bounds = new mapAPI.LatLngBounds();

		trackPath.getPath().forEach(function (e) {
			bounds.extend(e);
		});
		// bounds auf karte zentrieren
		map.fitBounds(bounds);
	}
}

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
	var listHeight = winHeight - navHeight;
	// anzahl der einträge pro seite berechnen
	nrOfEntries = Math.floor(listHeight / liHeight);
	// anzahl der seiten berechnen
	pages = Math.ceil(tracks.length / nrOfEntries);
	// li zur anzeige der seitenzahlen füllen
	var pageLi = document.getElementById("pages");
	pageLi.innerHTML = currPage + " / " + pages;

	// fix für onresize (falls aktuelle seite > anzahl an seiten => aktuelle seite = letzte seite)
	if (currPage > pages) {
		currPage = pages;
	}

	// jedes item auf seite als li erstellen + id etc. vergeben
	for (var track = (currPage - 1) * nrOfEntries; track < currPage * nrOfEntries; track++) {
		if (tracks[track] !== undefined) {
			li = document.createElement("li");
			li.setAttribute("class", "tracker-item");
			li.setAttribute("id", tracks[track].trackID);
			li.innerHTML = tracks[track].trackName;
			li.addEventListener("click", onClick, false);
			// angeklickter track soll auch in pagination dunkel hinterlegt werden/bleiben
			if (lastTrack !== null && lastTrack.innerHTML === tracks[track].trackName) {
				li.style.backgroundColor = "#8BC34A";
				lastTrack = li;
			}
			trackList.appendChild(li);
		}
	}
}

/*
 * setze marker auf map für angeklickten track
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

// aktuelle Seite inkrementieren
function incrementPage() {
	if (currPage < pages) {
		currPage++;
	}
	fillTracks();
}

// aktuelle Seite dekrementieren
function decrementPage() {
	if (currPage > 1) {
		currPage--;
	}
	fillTracks();
}
