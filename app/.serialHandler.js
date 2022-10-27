const db = require("../services/cuts");
const { boxSize } = require("../config");
const { ReadlineParser } = require("@serialport/parser-readline");
const {
  MESUARING,
  PULLING,
  CONFIRMING,
  TAIL_CUT,
  PUSH,
  CUT,
  TALL,
  TOWER,
  JITNEY
} = require("../config/constants/flags");
const {
  PROXIMITY_SENSOR,
  ULTRASONIC_SENSOR,
  MOTOR,
  COMPARATOR
} = require("../config/constants/sensors");

module.exports = function(port, fish_buffer) {
  //=============================================== Functions =====================================================

  deleteProcessedFishes = () => {
    if (fish_buffer[0] == undefined) fish_buffer.shift();
    fish_buffer = fish_buffer.filter(fish => {
      if (fish != null) return fish.position + 1 <= CONFIRMING;
      else return true; //                    ⬆ Next Position
    });
  };

  incrementFlag = () => {
    fish_buffer.forEach(fish =>
      fish !== undefined ? fish.position++ : undefined
    );
  };

  getNextOn = position => {
    return fish_buffer.find(fish => {
      if (fish != null) return fish.position == position;
    });
  };

  getCuts = fish_size => {
    // var indexArr = cuts_data.map(cuts => Math.abs(cuts.SENSOR - fish_size));
    // var min = Math.min.apply(Math, indexArr);
    // const csv_value = cuts_data[indexArr.indexOf(min)];
    const db_value = db.getBySize(fish_size);
    //
    // console.log(db_value.data[0]);
    // console.log(csv_value);
    //==================================== CSV TO DB COMPARATION! ====================== !!!!!!!!!!!!!!!!!!!!!!!!!!
    return db_value.data[0];
  };

  flagAction = () => {
    if (fish_buffer.length > 0) {
      // console.warn("FLAG");
      deleteProcessedFishes();
      incrementFlag();
      // const next_to_pull = getNextOnPull();
      // const sensor_socket = getSocketFromSensor("MOT");
      // if (next_to_pull && sensor_socket) {
      //   sensor_socket.emit("pull", next_to_pull.cuts.SERVO);
      // }
    }
  };

  ultraAction = size => {
    const VALID = size < boxSize;
    if (VALID) {
      const cuts = getCuts(size);
      fish_buffer.push({ position: 1, size, cuts });
      const theres_pull = getNextOn(PULLING);
      const theres_cut = getNextOn(CONFIRMING);
      var data = {};
      if (theres_pull) {
        data = { ...data, mot: theres_pull.cuts.SERVO };
      }
      if (theres_cut) {
        const { RELAY1, SERVO, SERVO2 } = theres_cut.cuts;
        const { RELAY2, RELAY3, RELAY4, RELAY5, RELAY6 } = theres_cut.cuts;
        data = {
          ...data,
          SV1: SERVO2, // just to test
          SV2: SERVO2,
          RLY1: RELAY1,
          RLY2: RELAY2,
          RLY3: RELAY3,
          RLY4: RELAY4,
          RLY5: RELAY5,
          RLY6: RELAY6
        };
      }

      // socket.emit("pull", data);
      port.write(JSON.stringify(data));

      // socket.emit("actions", data);
      // }
    } else fish_buffer.push(undefined);
    console.warn(fish_buffer);
  };

  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.open(err => {
    if (err) return console.log("Error opening port: ", err.message);
  });

  //============================================== Socket handlers ================================================
  port.on("open", () => {
    //=========================================== Handle sensors actions ==========================================
    parser.on("data", data => {
      const str = data.toString(); //Convert to string
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
            console.warn("falió! ----> " + act);
        }
      } catch (e) {
        // console.warn("Caught: " + e.message);
      }
      // const JSONData = JSON.parse(str); //Then parse it
    });
  });
};
