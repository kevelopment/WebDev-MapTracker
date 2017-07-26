var trackNames;
let trackReader = require("./trackReader");

module.exports = function (app) {
	trackNames = trackReader.getTrackNames();

	// handle GET /tracks request => send stringified JSON response
	app.get("/track", function (req, res) {
		res.json(trackNames);
	});

	// handle GET /id request not required yet
	app.get("/track/:id", function (req, res) {
		var trackID = req.params.id;
		var data = trackReader.getTrackName(trackID, trackNames);
		if (!data) {
			res.sendStatus(404);
		}
		else {
			res.json(data);
		}
	});
};
