var mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
var http = require("http");

// init maps api + map frame
mapsapi().then(
	function (maps) {
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		let map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
		console.log("MAPS API loaded");
	}
);

// onload: create http get request to init track list
window.onload = function () {
	let serverUrl = "http://localhost:8080/tracks";
	let trackList = document.getElementById("tracks");

	// http get request to server/tracks to get list of tracks
	http.get(serverUrl, (res) =>{
		console.log("Got message from Server:");
		let rawData = "";
		// parse data from server
		res.on("data", (chunk) => {
			rawData += chunk;
		});
		// parse data into json
		res.on("end", () => {
			var data = JSON.parse(rawData);
			// for each item in tracks: create list item
			var li;
			for (var track in data) {
				li = document.createElement("li");
				li.setAttribute("class", "tracker-item");
				li.innerHTML = data[track];
				trackList.appendChild(li);
			}
		});
	});
};
