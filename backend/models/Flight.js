const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  flight_number: String,
  origin: String,
  destination: String
});

module.exports = mongoose.model("Flight", flightSchema);
