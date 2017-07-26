const path = require("path");
const fs = require("fs");
const dataPath = (path.join(__dirname, "./data"));

// load track names from /data folder
exports.getTrackNames = function () {
	let trackNames = [];
	fs.readdirSync(dataPath).forEach((file) => {
		let content = fs.readFileSync(path.join(dataPath, file));
		let id = file.split(".")[0];
		let json = JSON.parse(content);
		trackNames.push({ trackID: id, trackName: json.features[0].properties.name });
	});
	return trackNames;
};

exports.trackExists = function (trackID, trackNames) {
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
};

exports.getTrackName = function (trackID, trackNames) {
	//console.log(this.trackExists(trackID));
	if (!this.trackExists(trackID, trackNames)) {
		return null;
	}
	else {
		console.log("getTrackName:" + trackID, typeof (trackID));
		let content = fs.readFileSync(path.join(dataPath, trackID + ".json"));
		let json = JSON.parse(content);
		return json;
	}
};
