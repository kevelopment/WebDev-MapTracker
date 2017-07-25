const path = require("path");
const fs = require("fs");
const dataPath = (path.join(__dirname, "./data"));
var trackNames;

module.exports = function (app) {
	trackNames = getTrackNames();

	// handle GET /tracks request => send stringified JSON response
	app.get("/track", function (req, res) {
		console.log("GET /track");
		res.send(JSON.stringify(trackNames));
	});

	// handle GET /id request not required yet
	app.get("/track/:id", function (req, res) {
		console.log("GET /track/*");
		var trackID = req.params.id;
		console.log("TRACKID: " + trackID);
		var data = getTrackName(trackID);
		console.log(data);
		if (!data) {
			res.sendStatus(404);
		}
		else {
			res.send(data);
		}
	});

	// handle POST request not required yet
	// app.post("/track", function (req, res) {
	// 	console.log("GET /track");
	// 	var trackID = "";
	// 	req.on("data", function (chunk) {
	// 		trackID += chunk.toString();
	// 	});
	// 	req.on("end", function () {
	// 		console.log("GOT DATA: " + JSON.parse(trackID));
	// 		res.send(getTrackName(JSON.parse(trackID)));
	// 	});
	// });
};

// load track names from /data folder
function getTrackNames() {
	let trackNames = [];
	fs.readdirSync(dataPath).forEach((file)=>{
		let content = fs.readFileSync(path.join(dataPath, file));
		let id = file.split(".")[0];
		let json = JSON.parse(content);
		trackNames.push({ trackID: id, trackName: json.features[0].properties.name });
	});
	return trackNames;
}

function trackExists(trackID) {
	// console.log(trackNames);
	for (var index = 0; index < trackNames.length; index++) {
		console.log("TRACK EXISTS");
		console.log(trackNames[index].trackID, typeof (trackNames[index].trackID));
		console.log(trackID, typeof (trackID));
		console.log(trackNames[index].trackID === trackID);
		if (trackNames[index].trackID === trackID) {
			return true;
		}
	}
	return false;
}

function getTrackName(trackID) {
	console.log(trackExists(trackID));
	if (!trackExists(trackID)) {
		return null;
	}
	else {
		console.log("getTrackName:" + trackID, typeof (trackID));
		let content = fs.readFileSync(path.join(dataPath, trackID + ".json"));
		let json = JSON.parse(content);
		return JSON.stringify(json);
	}
}
