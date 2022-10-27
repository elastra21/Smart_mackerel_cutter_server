const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
var cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");

const port = process.env.PORT || 3000;
const cuts_data = [];
var sensor_list = {};
var fish_buffer = [];
const data_path = "./data/data_fish_size.csv";

app.use(cors());
app.options("*", cors());
app.use(express.static(__dirname + "public"));
app.use(express.static("public"));

fs.createReadStream(data_path)
  .pipe(csv())
  .on("data", data => {
    try {
      cuts_data.push(data);
      // console.log("Name is: " + data.SENSOR);
    } catch (err) {}
  })
  .on("end", function() {
    console.warn(cuts_data.length);
  });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

require("./app/socketHandlers.js")(io, cuts_data, sensor_list, fish_buffer);

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

module.exports = app;
