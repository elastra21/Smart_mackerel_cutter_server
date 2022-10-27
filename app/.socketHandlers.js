const db = require("../services/cuts");
const { boxSize } = require("../config");
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

module.exports = function(io, cuts_data, sensor_list, fish_buffer) {
  //=============================================== Functions =====================================================

  addToSensorList = (id, socket_id) => {
    sensor_list[id] = socket_id;
  };

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

  getSocketFromSensor = id => {
    return io.sockets.connected[sensor_list[id]];
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
  //============================================== Socket handlers ================================================
  io.on("connection", socket => {
    /* This guy catch each new user and request him to identify it self and get if he is a SENSOR or an USER  */
    socket.emit("setUp");

    //========================================== Log and Testing Handler ==========================================

    socket.on("chat message", function(msg) {
      io.emit("chat message", msg);
    });

    //=========================================== Setting up each sensor roll =====================================

    socket.on("set_sensor", sensor => {
      /* If on "setUp" was a sensor this handler will save the socket id on the correct field */
      addToSensorList(sensor.id, socket.id);
    });

    //=========================================== Handle sensors actions ==========================================

    socket.on("flag", msg => {
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
    });

    socket.on("ultra", msg => {
      const { size } = msg;
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
          const { RELAY1 } = theres_cut.cuts;
          const { RELAY2, RELAY3, RELAY4, RELAY5, RELAY6 } = theres_cut.cuts;
          data = {
            ...data,
            cut1: RELAY1, // just to test
            cut2: RELAY6, // just to test
            RELAY1,
            RELAY2,
            RELAY3,
            RELAY4,
            RELAY5,
            RELAY6
          };
        }

        // socket.emit("pull", data);
        console.warn("\n");
        console.warn("\n");
        console.warn("\n");
        console.warn(data);
        console.warn("\n");
        console.warn("\n");
        console.warn("\n");

        socket.emit("actions", data);
        // }
      } else fish_buffer.push(undefined);
      console.warn(fish_buffer);
    });
    //
  });
};
