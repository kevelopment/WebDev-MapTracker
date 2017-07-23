const path = require("path");
const fs = require("fs");
const dataPath = (path.join(__dirname, "./data"));
var trackNames;

module.exports = function (app) {
	trackNames = getTrackNames();

	// handle GET /tracks request => send stringified JSON response
	app.get("/tracks", function (req, res) {
		console.log("got get /tracks request");
		res.send(JSON.stringify(trackNames));
	});

	// handle POST request not required yet
	app.post("/track", function (req, res) {
		console.log("got get /track request");
		var trackID = "";
		req.on("data", function (chunk) {
			trackID += chunk.toString();
		});
		req.on("end", function () {
			console.log(trackID);
			res.send(getTrackName(trackID));
		});
	});
};

// load track names from /data folder
function getTrackNames() {
	let trackNames = [];
	fs.readdirSync(dataPath).forEach((file)=>{
		let content = fs.readFileSync(path.join(dataPath, file));
		let json = JSON.parse(content);
		trackNames.push(json.features[0].properties.name);
	});
	return trackNames;
}

function getTrackName(trackID) {
	var idx = trackNames.indexOf(trackID) + 1;
	let content = fs.readFileSync(path.join(dataPath, idx + ".json"));
	let json = JSON.parse(content);
	return JSON.stringify(json);
}
