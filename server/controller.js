const path = require("path");
const fs = require("fs");

module.exports = function (app) {
	let trackNames = getTrackNames(path.join(__dirname, "./data"));

	// handle GET /tracks request => send stringified JSON response
	app.get("/tracks", function (req, res) {
		res.send(JSON.stringify(trackNames));
	});
	// handle POST request not required yet
	app.post("/", function (req, res) {
		res.send("POST request");
	});
};

// load track names from /data folder
function getTrackNames(dataPath) {
	let trackNames = [];
	fs.readdirSync(dataPath).forEach((file)=>{
		let content = fs.readFileSync(path.join(dataPath, file));
		let json = JSON.parse(content);
		trackNames.push(json.features[0].properties.name);
	});
	return trackNames;
}
