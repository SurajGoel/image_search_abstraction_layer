var express = require("express");
var initializeService = require("./api.js");
var app = express();

initializeService(app);

app.listen(8080, function(req, res) {
    console.log("Listening");
});
