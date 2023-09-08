// const fs = require("fs");
// const csv = require("csv-parser");
const mqtt = require('mqtt');
const dgram = require("dgram");
const client = dgram.createSocket("udp4");
const { port, host } = require("./config");

var fish_buffer = [];
const pub = mqtt.connect('mqtt://192.168.100.50:1883');

require("./app/udpHandler.js")(client, fish_buffer, pub);