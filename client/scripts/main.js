var mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
var fetch = require("node-fetch");

const serverUrl = "http://localhost:8080/getAllTracks";
const trackUrl = "http://localhost:8080/track";
// mapAPI object for Polyline
var mapAPI;
// map Object
var map;
var coordinates;
// coordinate[] of last drawn track
var trackPath;
// list of tracks: {trackID: id, trackName: name}
var tracks = [];

/*
 * Pagination vars:
 * pages => nr of pages in total
 * currPage => current Page index
 * nrTracks => nr of tracks per page
*/
var pages;
var currPage;
var nrOfEntries;

// init maps api + map frame
mapsapi().then(
	function (maps) {
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		mapAPI = maps;
		map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
		console.log("MAPS API loaded");
	}
);

// onload: create http get request to init track list
window.onload = function () {
	fetch(serverUrl)
		.then(function (res) {
			return res.text();
		}).then(function (body) {
			var data = JSON.parse(body);
			console.log(JSON.parse(body));

			for (var idx in data) {
				tracks.push(data[idx]);
			}

			currPage = 1;
			fillTracks();

			var incPageLi = document.getElementById("inc");
			var decPageLi = document.getElementById("dec");
			incPageLi.addEventListener("click", () => { incrementPage(); });
			decPageLi.addEventListener("click", () => { decrementPage(); });
		});
	// .then(function (json) {
	// 	console.log(json);
	// });
};

window.onresize = function () {
	fillTracks();
	fitMap();
};

// onclick: get track data from server
function onClick() {
	// console.log("li.id: " + this.id);
	var body = this.id;
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
		ctx.lineTo(index * lineSize, ctx.canvas.height - (height * heightSize));
	}
	ctx.stroke();
	//console.log("HIGHTDONE");
}

function drawOnMap(json) {
	//console.log("drawOnMap");
	let entries = json.features[0].geometry.coordinates;

	// reset previous map polyline
	if (trackPath !== undefined) {
		trackPath.setMap(null);
	}

	// fill coordinates from file
	coordinates = [];
	for (var i in entries) {
		coordinates.push({ lat: entries[i][1], lng: entries[i][0] });
	}

	// create polyline
	trackPath = new mapAPI.Polyline({
		path: coordinates,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	fitMap();
	trackPath.setMap(map);
}

function fitMap() {
	// get polyline bounds
	var bounds = new mapAPI.LatLngBounds();
	trackPath.getPath().forEach(function (e) {
		bounds.extend(e);
	});

	// reihenfolge wichtig!!
	map.fitBounds(bounds);
}

function fillTracks() {
	var trackList = document.getElementById("tracks");
	// reset trackList
	trackList.innerHTML = "";

	var pageLi = document.getElementById("pages");

	var li;
	var winHeight = document.getElementById("trackSelector").offsetHeight;
	var navHeight = document.getElementById("controls").offsetHeight;

	li = document.createElement("li");
	li.innerHTML = tracks[0].trackName;
	trackList.appendChild(li);

	var liHeight = li.offsetHeight + 16; // + padding top & bottom
	li.parentNode.removeChild(li);

	var listHeight = winHeight - navHeight;

	nrOfEntries = Math.floor(listHeight / liHeight);
	console.log("trackslength: ", tracks.length);
	console.log("nrOfEntries: ", nrOfEntries);
	pages = Math.ceil(tracks.length / nrOfEntries);
	pageLi.innerHTML = currPage + " / " + pages;
	console.log("currentPage: ", currPage);
	console.log("nrOfEntries: ", nrOfEntries);
	console.log("Pages: ", pages);

	// for each item in tracks: create list item
	for (var track = (currPage - 1) * nrOfEntries; track < currPage * nrOfEntries; track++) {
		//tracks.push(tracks[track]);
		// console.log(track, data[track]);
		li = document.createElement("li");
		li.setAttribute("class", "tracker-item");
		li.setAttribute("id", tracks[track].trackID);
		li.innerHTML = tracks[track].trackName;
		li.addEventListener("click", onClick, false);
		trackList.appendChild(li);
	}
}

function incrementPage() {
	if (currPage < pages) {
		currPage++;
	}
	fillTracks();
}

function decrementPage() {
	if (currPage > 1) {
		currPage--;
	}
	fillTracks();
}
