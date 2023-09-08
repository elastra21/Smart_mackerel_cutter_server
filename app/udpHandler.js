const db = require("../services/cuts");
const { boxSize, port, host, FLAG, ULTRA } = require("../config");
const {
  MOT_POS,
  SERVO_POS,
  SERVO2_POS,
  RELAY1_POS,
  RELAY2_POS,
  RELAY3_POS,
  RELAY4_POS,
  RELAY5_POS,
  RELAY6_POS,
} = require("../config");

const {
  MESUARING,
  PULLING,
  CONFIRMING,
  TAIL_CUT,
  PUSH,
  CUT,
  TALL,
  TOWER,
  JITNEY,
} = require("../config/constants/flags");
const {
  PROXIMITY_SENSOR,
  ULTRASONIC_SENSOR,
  MOTOR,
  COMPARATOR,
} = require("../config/constants/sensors");

var tb_class = 0;
var twb_class = 0;
var jb_class = 0;
var tt_class = 0;
var twt_class = 0;
var jt_class = 0;

// {"tbClass": 1, "twbClass": 0, "jbClass": 0, "ttClass": 1, "twtClass": 0, "jtClass": 0}

module.exports = function (client, fish_buffer, pub) {
  //=============================================== Functions =====================================================

  deleteProcessedFishes = () => {
    if (fish_buffer[0] == undefined) fish_buffer.shift();
    fish_buffer = fish_buffer.filter(
      (fish) => (fish != null ? fish.position + 1 <= CONFIRMING : true)
      //                     ⬆ Next Position
    );
  };

  incrementFlag = () => {
    fish_buffer.forEach((fish) =>
      fish !== undefined ? fish.position++ : undefined
    );
  };

  clasifyFish = (cuts, size) => {
    tb_class   += cuts.RELAY1;
    twb_class  += cuts.RELAY2;
    jb_class   += cuts.RELAY3;
    tt_class   += cuts.RELAY4;
    twt_class  += cuts.RELAY5;
    jt_class   += cuts.RELAY6;

    const statisticSizes = {
      size,
      tbClass:  tb_class , // 0
      twbClass: twb_class, // 0
      jbClass:  jb_class , // 0
      ttClass:  tt_class , // 1
      twtClass: twt_class, // 0
      jtClass:  jt_class , // 0
    };

    if (pub.connected)
      pub.publish("stat_mackerel", JSON.stringify(statisticSizes));
  };

  getNextOn = (position) => {
    return fish_buffer.find((fish) => {
      if (fish != null) return fish.position == position;
    });
  };

  getCuts = (fish_size) => {
    const db_value = db.getBySize(fish_size);
    return db_value.data[0];
  };

  flagAction = () => {
    if (fish_buffer.length > 0) {
      console.warn("FLAG");
      deleteProcessedFishes();
      incrementFlag();
      // const next_to_pull = getNextOnPull();
      // const sensor_socket = getSocketFromSensor("MOT");
      // if (next_to_pull && sensor_socket) {
      //   sensor_socket.emit("pull", next_to_pull.cuts.SERVO);
      // }
    }
  };

  ultraAction = (size) => {
    const VALID = size < boxSize;
    console.warn("ULTRA");
    if (true) {
      const cuts = getCuts(size);
      // fish_buffer.push({ position: 1, size, cuts });
      // const theres_pull = getNextOn(PULLING);
      // const theres_cut = getNextOn(CONFIRMING);

      // if (theres_pull) {
      //   data[MOT_POS] = theres_pull.cuts.SERVO;
      //   // data = { ...data, mot: theres_pull.cuts.SERVO };
      // }
      // if (theres_cut) {
      // const { RELAY1, SERVO, SERVO2 } = theres_cut.cuts;
      // const { RELAY2, RELAY3, RELAY4, RELAY5, RELAY6 } = theres_cut.cuts;
      console.log(cuts);
      clasifyFish(cuts, size);
      const { RELAY1, SERVO, SERVO2 } = cuts;
      const { RELAY2, RELAY3, RELAY4, RELAY5, RELAY6 } = cuts;

      var data = [
        SERVO,
        SERVO2,
        RELAY1,
        RELAY2,
        RELAY3,
        RELAY4,
        RELAY5,
        RELAY6,
      ];

      const string_msg = JSON.stringify(data);
      client.send(string_msg, 0, string_msg.length, port, host);
      // }
    } else {
    } /* fish_buffer.push(undefined);
    console.warn(fish_buffer);*/
  };

  //============================================== Socket handlers ================================================
  var message = new Buffer("My KungFu is Good!");
  client.send(message, 0, message.length, port, host, function (err, bytes) {
    if (err) throw err;
    console.log("UDP message sent to " + host + ":" + port);
  });

  //=========================================== Handle sensors actions ==========================================
  client.on("message", function (msg, info) {
    const str = msg.toString(); //Convert to string
    console.warn(str);
    try {
      const JSONData = JSON.parse(str);
      const { act, sz } = JSONData;
      switch (act) {
        case FLAG:
          flagAction();
          break;
        case ULTRA:
          ultraAction(sz);
          break;
        default:
          console.warn("falió! ----> " + act + 5);
      }
    } catch (e) {
      console.warn("Caught: " + e.message);
    }
  });
};
