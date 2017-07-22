const path = require("path");
const fs = require("fs");
const dataPath = (path.join(__dirname, "./data"));

module.exports = function (app) {
	let trackNames = getTrackNames();

	// handle GET /tracks request => send stringified JSON response
	app.get("/tracks", function (req, res) {
		console.log("got get /tracks request");
		res.send(JSON.stringify(trackNames));
	});

	// handle POST request not required yet
	app.post("/track", function (req, res) {
		console.log("got get /track request");
		//var track = req.param("name", null);
		/*
		* TODO: get track name from req body!!
		*/
		console.log(req);
		res.send(getTrackName(/*tackName*/));
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

function getTrackName() {
	/*
	let content = fs.readFileSync(path.join(dataPath, trackName));
	let json = JSON.parse(content);
	return JSON.stringify(json);
	*/
	let content = fs.readFileSync(path.join(dataPath, "1.json"));
	let json = JSON.parse(content);
	return JSON.stringify(json);
}
