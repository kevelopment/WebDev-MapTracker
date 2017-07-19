var mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");

mapsapi().then(
	function (maps) {
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		let map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
		console.log("MAPS API loaded");
	}
);

/*
(function () {
var connection = new WebSocket("ws://localhost:8080");
connection.onopen = () => {
	console.log("Connection opened.");
};
connection.onerror = () => {
	console.log("Unable to connect.");
};
connection.onclose = () => {
	console.log("Connection closed.");
};
connection.onmessage = event => {
	console.log(event.data, "Received: ");
};
//});();
*/
