const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const filepath = "registered.sqlite";

function createTable(db) {
  db.exec(`
  CREATE TABLE id_pairs
  (
    confirmation_number       VARCHAR(11),
    discord_id                VARCHAR(18)
  )
`);
}

module.exports = {
  connectToDatabase: function () {
    if (fs.existsSync(filepath)) {
      console.log("Connected to the database successfully...");
      return new sqlite3.Database(filepath);
    } else {
      const db = new sqlite3.Database(filepath, (error) => {
        if (error) {
          return console.error(error.message);
        }
        createTable(db);
        console.log("Created the database successfully...");
      });
      return db;
    }
  }
};