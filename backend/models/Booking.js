const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  flight: { type: mongoose.Schema.Types.ObjectId, ref: "Flight" },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: "Passenger" }
});

module.exports = mongoose.model("Booking", bookingSchema);
