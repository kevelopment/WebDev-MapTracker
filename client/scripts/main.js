var mapsapi = require("google-maps-api")("AIzaSyDCmCd8AWwgFL_5oJWKSZOjoQHuHmYOZmQ");
var net = require("net");

mapsapi().then(
	function (maps) {
		let trier = { lat: 49.7596121, lng: 6.6440247 };
		let map = new maps.Map(document.getElementById("map"), { zoom: 14, center: trier });
		console.log("MAPS API loaded");
	}
);

var client = new net.Socket();
client.connect(8080, "127.0.0.1", () => {
	console.log("Connected");
	client.write("Hello, server!");
});

client.on("data", (data) => {
	console.log("Received: " + data);
});
