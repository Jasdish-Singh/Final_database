const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Make sure to call config() to load .env variables

const app = express();
const port = process.env.PORT || 4000; // Use environment variable for port or default to 4000

// --- Model Definitions ---
// Define models *before* they are used in routes

// Passenger Model
const passengerSchema = new mongoose.Schema({
  full_name: { type: String, required: [true, "Full name is required"] },
  email: {
     type: String,
     required: [true, "Email is required"],
     unique: true, // Ensures no duplicate emails
     lowercase: true, // Store emails consistently
     match: [/.+\@.+\..+/, 'Please fill a valid email address'] // Basic email format validation
    },
  phone: String, // Optional
}, { timestamps: true }); // Adds createdAt and updatedAt
const Passenger = mongoose.model("Passenger", passengerSchema);

// Flight Model
const flightSchema = new mongoose.Schema({
  flight_number: { type: String, required: true, unique: true, uppercase: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departure_time: { type: Date, required: true },
  arrival_time: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 }, // Price cannot be negative
  // You could add capacity, remaining_seats etc. here
}, { timestamps: true });
const Flight = mongoose.model("Flight", flightSchema);

// Booking Model
const bookingSchema = new mongoose.Schema(
  {
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: [true, "Booking must reference a flight"],
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: [true, "Booking must reference a passenger"],
    },
    seat_number: {
      type: String, // Example: Add seat number if needed
    },
    // booking_date is handled by timestamps: true (createdAt)
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);
const Booking = mongoose.model("Booking", bookingSchema);

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for all origins
app.use(express.json()); // Parse incoming JSON request bodies

// --- MongoDB Connection ---
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1); // Exit if DB connection string is missing
}

mongoose
  .connect(mongoUri) // Mongoose 6+ handles deprecated options automatically
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message); // Log only the message for cleaner output
    process.exit(1); // Exit on critical connection error
  });

// Handle MongoDB connection events after initial connection
mongoose.connection.on('error', err => {
  console.error("MongoDB runtime error:", err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn("MongoDB disconnected.");
});

// --- Routes ---

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Flight Booking API is running." });
});

// Get all flights
app.get("/flights", async (req, res) => {
  try {
    // You might add sorting, e.g., by departure time: .sort({ departure_time: 1 })
    const flights = await Flight.find().sort({ departure_time: 1 });
    res.status(200).json(flights); // Use 200 OK status and send JSON
  } catch (err) {
    console.error("Error fetching flights:", err);
    res.status(500).json({ message: "Error fetching flights", error: err.message });
  }
});

// Create a new passenger
app.post("/passengers", async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;

    // Mongoose schema validation handles required fields now
    // // Basic validation (redundant if using Mongoose validation effectively)
    // if (!full_name || !email) {
    //     return res.status(400).json({ message: "Full name and email are required." });
    // }

    // // Check if passenger already exists (handled by unique index, but explicit check can give better msg)
    // const existingPassenger = await Passenger.findOne({ email: email });
    // if (existingPassenger) {
    //     return res.status(409).json({ message: `Passenger with email ${email} already exists.` }); // 409 Conflict
    // }

    const passenger = new Passenger({ full_name, email, phone });
    await passenger.save(); // This will trigger schema validation

    // Send JSON response on success
    res.status(201).json({
        message: `Passenger created successfully`,
        passengerId: passenger._id,
        passenger: passenger // Send the full passenger object back
    });

  } catch (err) {
    console.error("Error adding passenger:", err);
    if (err.code === 11000) { // Handle duplicate key error (e.g., email)
        res.status(409).json({ message: "Passenger with this email already exists." }); // 409 Conflict
    } else if (err.name === 'ValidationError') {
        // Extract validation messages for a more specific error response
        const messages = Object.values(err.errors).map(val => val.message);
        res.status(400).json({ message: "Validation Error", errors: messages }); // 400 Bad Request
    }
     else {
        res.status(500).json({ message: "Error adding passenger", error: err.message });
    }
  }
});

// Create a new booking
app.post("/bookings", async (req, res) => {
  try {
    const { flight_id, passenger_id, seat_number } = req.body; // Added seat_number

    // Basic validation
    if (!flight_id || !passenger_id) {
        return res.status(400).json({ message: "Flight ID and Passenger ID are required." });
    }

    // Check if Flight and Passenger exist using Promise.all for efficiency
    const [flight, passenger] = await Promise.all([
        Flight.findById(flight_id),
        Passenger.findById(passenger_id)
    ]);

    if (!flight) {
        return res.status(404).json({ message: `Flight with ID ${flight_id} not found.` }); // 404 Not Found
    }
    if (!passenger) {
        return res.status(404).json({ message: `Passenger with ID ${passenger_id} not found.` }); // 404 Not Found
    }

    // TODO: Add more booking logic here if needed:
    // - Check flight capacity/seat availability
    // - Ensure passenger doesn't already have a booking on this flight
    // - Payment processing simulation/integration

    const bookingData = {
        flight: flight_id,
        passenger: passenger_id
    };
    if (seat_number) { // Only add seat_number if provided
        bookingData.seat_number = seat_number;
        // You might want validation to ensure the seat format is correct or if it's already taken
    }

    const booking = new Booking(bookingData);
    await booking.save(); // Will trigger schema validation if any

    // Populate references to return more useful info in the response
    await booking.populate('flight');
    await booking.populate('passenger');

    res.status(201).json({ message: "Booking successful", booking: booking }); // Send JSON

  } catch (err) {
    console.error("Error creating booking:", err);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        res.status(400).json({ message: "Validation Error", errors: messages }); // 400 Bad Request
    } else if (err.name === 'CastError' && err.path && (err.path === 'flight' || err.path === 'passenger')) { // Improved CastError check
         res.status(400).json({ message: `Invalid format for ${err.path} ID.`}); // 400 Bad Request
    }
    else {
        res.status(500).json({ message: "Booking failed", error: err.message });
    }
  }
});

// Get all bookings (with populated details)
app.get("/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('flight', 'flight_number origin destination departure_time') // Select specific fields from Flight
            .populate('passenger', 'full_name email') // Select specific fields from Passenger
            .sort({ createdAt: -1 }); // Show newest bookings first

        res.status(200).json(bookings); // Send JSON
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ message: "Error fetching bookings", error: err.message });
    }
});

// --- Centralized Error Handling (Optional but Recommended) ---
// Catch-all for routes not defined
app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Generic error handler (must have 4 arguments)
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err); // Log the full stack trace
    res.status(500).json({ message: 'Something went wrong on the server!', error: err.message });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`API endpoints available at:`);
  console.log(`  GET  /`);
  console.log(`  GET  /flights`);
  console.log(`  POST /passengers { full_name, email, phone? }`);
  console.log(`  POST /bookings { flight_id, passenger_id, seat_number? }`);
  console.log(`  GET  /bookings`);

});