const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema({
  full_name: String,
  email: String,
  phone: String
});

module.exports = mongoose.model("Passenger", passengerSchema);
