const express = require("express");
const path = require("path");
const controller = require("./server/controller");

let app = express();

const PORT = 8080;

app.use(express.static(path.join(__dirname, "./public")));

controller(app);

// Starte Server an Port PORT
app.listen(PORT, () =>
	console.log("Server started on Port %d...", PORT)
);
