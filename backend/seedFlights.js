// seedFlights.js
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Use dotenv to manage connection string like in server.js

// Get MongoDB connection URL from environment variable or use default
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
// Extract DB name from URI if possible, or use a default
// (This is a simple way; more robust parsing might be needed for complex URIs)
const dbNameFromUri = mongoURI.split('/').pop().split('?')[0];
const dbName = dbNameFromUri || 'flightBookingDB'; // Use extracted name or default

const client = new MongoClient(mongoURI);

console.log(`Attempting to connect to MongoDB at: ${mongoURI}`);
console.log(`Target database: ${dbName}`);

// --- UPDATED FLIGHT DATA with PRICE ---
const flights = [
  {
    flight_number: 'AA101',
    origin: 'Toronto Pearson Intl (YYZ)', // More specific names
    destination: 'New York LaGuardia (LGA)',
    departure_time: new Date('2025-07-10T08:00:00Z'), // Use UTC 'Z'
    arrival_time: new Date('2025-07-10T09:35:00Z'),   // Use UTC 'Z'
    price: 275.50, // Added price
  },
  {
    flight_number: 'UA202', // Changed airline code for variety
    origin: 'Vancouver Intl (YVR)',
    destination: 'Los Angeles Intl (LAX)',
    departure_time: new Date('2025-07-15T09:30:00Z'), // Use UTC 'Z'
    arrival_time: new Date('2025-07-15T12:15:00Z'),   // Use UTC 'Z'
    price: 350.00, // Added price
  },
  {
    flight_number: 'AC303', // Changed airline code
    origin: 'Calgary Intl (YYC)',
    destination: "Chicago O'Hare (ORD)",
    departure_time: new Date('2025-07-20T14:00:00Z'), // Use UTC 'Z'
    arrival_time: new Date('2025-07-20T17:50:00Z'),   // Use UTC 'Z'
    price: 410.75, // Added price
  },
  {
    flight_number: 'DL404', // Added another flight
    origin: 'New York LaGuardia (LGA)',
    destination: 'Toronto Pearson Intl (YYZ)',
    departure_time: new Date('2025-07-11T11:00:00Z'), // Use UTC 'Z'
    arrival_time: new Date('2025-07-11T12:30:00Z'),   // Use UTC 'Z'
    price: 260.00, // Added price
  },
];

async function seedFlights() {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Successfully connected.");
    const db = client.db(dbName);
    const flightsCollection = db.collection('flights'); // Mongoose default is lowercase plural

    // --- Optional: Clear existing flights first ---
    console.log("Deleting existing flights from the collection...");
    const deleteResult = await flightsCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing flight(s).`);
    // --- End Optional Clear ---

    console.log("Inserting new flight data...");
    // Insert the flights into the 'flights' collection
    const insertResult = await flightsCollection.insertMany(flights);

    console.log(`Successfully inserted ${insertResult.insertedCount} new flight(s) into the database!`);

  } catch (err) {
    console.error('ERROR seeding flights:', err);
    // More detailed error logging
    if (err.codeName === 'AuthenticationFailed') {
        console.error("MongoDB Authentication Failed: Check your username/password or connection string.");
    } else if (err.message.includes('connect ECONNREFUSED')) {
        console.error("MongoDB Connection Refused: Is the MongoDB server running at the specified address?");
    }
  } finally {
    console.log("Closing MongoDB connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

// Execute the seeding function
seedFlights();