var mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
var fetch = require("node-fetch");
var data;
var serverUrl = "http://localhost:8080/tracks";
var trackUrl = "http://localhost:8080/track";
var mapAPI;
var map;

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
	let trackList = document.getElementById("tracks");

	fetch(serverUrl)
		.then(function (res) {
			return res.text();
		}).then(function (body) {
			data = JSON.parse(body);
			// for each item in tracks: create list item
			var li;
			for (var track in data) {
				li = document.createElement("li");
				li.setAttribute("class", "tracker-item");
				li.innerHTML = data[track];
				li.addEventListener("click", onClick, false);
				trackList.appendChild(li);
			}
			console.log(JSON.parse(body));
		}).then(function (json) {
			console.log(json);
		});
};

function onClick() {
	console.log(this.innerHTML);

	fetch(trackUrl,
		{ method: "POST", body: "name=" + this.innerHTML })
		.then(function (res) {
			return res.text();
		}).then(function (body) {
			let json = JSON.parse(body);
			drawOnMap(json);
		});
}

function drawOnMap(json) {
	console.log("drawing...");
	let entries = json.features[0].geometry.coordinates;
	var coordinates = [];

	for (var i in entries) {
		coordinates.push({ lat: entries[i][1], lng: entries[i][0] });
	}

	var trackPath = new mapAPI.Polyline({
		path: coordinates,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	trackPath.setMap(map);
}
