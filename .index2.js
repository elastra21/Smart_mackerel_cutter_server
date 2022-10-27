// const fs = require("fs");
// const csv = require("csv-parser");
const { SerialPort } = require("serialport");
const { path, baudRate, autoOpen } = require("./config");

var fish_buffer = [];

const port = new SerialPort({ path, baudRate, autoOpen });

require("./app/serialHandler.js")(port, fish_buffer);
