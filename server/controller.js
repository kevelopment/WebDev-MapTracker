const path = require("path");
const fs = require("fs");
const dataPath = (path.join(__dirname, "./data"));
var trackNames;

module.exports = function (app) {
	trackNames = getTrackNames();

	// handle GET /tracks request => send stringified JSON response
	app.get("/getAllTracks", function (req, res) {
		console.log("GET /getrAllTracks");
		res.send(JSON.stringify(trackNames));
	});

	// handle POST request not required yet
	app.post("/track", function (req, res) {
		console.log("GET /track ");		
		
		var trackID = "";
		req.on("data", function (chunk) {
			trackID += chunk.toString();
		});
		req.on("end", function () {
			console.log("GOT DATA: "+JSON.parse(trackID));
			res.send(getTrackName(JSON.parse(trackID)));
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
	console.log(trackID, typeof(trackID));
	let content = fs.readFileSync(path.join(dataPath, trackID+".json"));
	let json = JSON.parse(content);
	return JSON.stringify(json);
}