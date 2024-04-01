const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ingredients
  (ingredient TEXT, cost REAL, number INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS positions
  (name TEXT)`);
  return db.run(`CREATE TABLE IF NOT EXISTS main
  (chatId INTEGER, status TEXT)`);
});

class Data {
  static findUser(chatId, cb) {
    return db.get("SELECT * FROM main WHERE chatId = ?", chatId, cb);
  }
  static createUser(chatId) {
    return db.run(
      "INSERT INTO main(chatId, status) VALUES (?, ?)",
      chatId,
      "default"
    );
  }
  static changeStatus(status, chatId) {
    return db.run(
      "UPDATE main SET status = ? WHERE chatId = ?;",
      status,
      chatId
    );
  }
  static showIngredient(cb) {
    return db.all(
      "SELECT rowid, ingredient, cost, number FROM ingredients",
      cb
    );
  }
  static changeIngredientCost(cost, id) {
    return db.run("UPDATE ingredients SET cost = ? WHERE rowid = ?", cost, id);
  }
  static changeIngredientNumber(number, id) {
    return db.run(
      "UPDATE ingredients SET number = ? WHERE rowid = ?",
      number,
      id
    );
  }
  static findIngredient(id, cb) {
    return db.get("SELECT * FROM ingredients WHERE rowid = ?", id, cb);
  }
  static findPosition(id, cb) {
    return db.get("SELECT * FROM positions WHERE rowid = ?", id, cb);
  }
  static allPositions(cb) {
    return db.all("SELECT rowid, * FROM positions", cb);
  }
  static showRecipe(id, cb) {
    return db.get("SELECT * FROM positions WHERE rowid = ?", id, cb);
  }
  static getIngredientNumber(id, cb) {
    return db.get(
      "SELECT number, ingredient FROM ingredients WHERE rowid = ?",
      id,
      cb
    );
  }
  static findIngredientByName(name, cb) {
    return db.get("SELECT * FROM ingredients WHERE ingredient = ?", name, cb);
  }
  static changeIngredientNumberByName(number, name) {
    return db.run(
      "UPDATE ingredients SET number = ? WHERE ingredient = ?",
      number,
      name
    );
  }
}

module.exports.Data = Data;
