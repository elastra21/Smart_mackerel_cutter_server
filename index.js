// const fs = require("fs");
// const csv = require("csv-parser");
const dgram = require("dgram");
const client = dgram.createSocket("udp4");
const { port, host } = require("./config");

var fish_buffer = [];

require("./app/udpHandler.js")(client, fish_buffer);
