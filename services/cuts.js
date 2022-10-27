const db = require("../services/db");

function getMultiple(page = 1) {
  const data = db.query(`SELECT * FROM sizes`, []);
  return { data };
}

function getBySize(SENSOR) {
  const data = db.query(
    `SELECT * FROM sizes ORDER BY ABS(SENSOR - ?) LIMIT 1 `,
    [SENSOR]
  );
  return { data };
}

module.exports = {
  getMultiple,
  getBySize
};
