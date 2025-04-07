import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure CSS is imported

const API_BASE_URL = 'http://localhost:4000';

function App() {
  // ... (Keep all your existing useState, useEffect, fetch functions, and handlers)
  const [flights, setFlights] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [selectedPassengerId, setSelectedPassengerId] = useState('');
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchFlights();
    fetchBookings();
    // Maybe fetch existing passengers on load if needed for selection
    // fetchPassengers();
  }, []);

  const fetchFlights = async () => {
    setLoadingFlights(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/flights`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFlights(data);
      if (data.length > 0 && !selectedFlightId) { // Avoid resetting selection if already made
        setSelectedFlightId(data[0]._id);
      }
    } catch (e) {
      console.error("Error fetching flights:", e);
      setError('Failed to fetch flights.');
    } finally {
      setLoadingFlights(false);
    }
  };

   const fetchBookings = async () => {
    setLoadingBookings(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBookings(data);
    } catch (e) {
      console.error("Error fetching bookings:", e);
      setError('Failed to fetch bookings.');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Example: Fetch passengers (if needed for initial dropdown population)
  // const fetchPassengers = async () => { ... implementation ... };

  const handleAddPassenger = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');
    if (!passengerName || !passengerEmail) {
      setError("Passenger name and email are required.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/passengers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: passengerName, email: passengerEmail, phone: passengerPhone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP error! status: ${response.status}`);

      setSuccessMessage(`Passenger '${result.passenger.full_name}' added!`);
      setPassengerName('');
      setPassengerEmail('');
      setPassengerPhone('');
      const newPassenger = result.passenger;
      setPassengers(prev => [...prev, newPassenger]);
      setSelectedPassengerId(newPassenger._id); // Auto-select new passenger
    } catch (e) {
      console.error("Error adding passenger:", e);
      setError(`Failed to add passenger: ${e.message}`);
    }
  };

  const handleAddBooking = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');
    if (!selectedFlightId || !selectedPassengerId) {
      setError("Please select both a flight and a passenger.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flight_id: selectedFlightId, passenger_id: selectedPassengerId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP error! status: ${response.status}`);

      setSuccessMessage('Booking created successfully!');
      fetchBookings(); // Refresh list
    } catch (e) {
      console.error("Error adding booking:", e);
      setError(`Failed to create booking: ${e.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    // No container div needed here if body handles centering
    <> {/* Use Fragment */}
      <header className="app-header">
        {/* Image is added via CSS background */}
        <h1>✈️ Flight Booking Portal</h1>
        <p>Your gateway to the skies</p>
      </header>

      <main className="container"> {/* Main content container */}

        {/* --- Error and Success Messages --- */}
        {/* Moved inside container for better centering */}
        {error && <p className="message error-message">😕 {error}</p>}
        {successMessage && <p className="message success-message">✅ {successMessage}</p>}

        {/* --- Section: Available Flights --- */}
        <section className="section">
          <h2>Available Flights</h2>
          {loadingFlights && <p className="loading-message">Loading flights...</p>}
          {!loadingFlights && flights.length === 0 && <p>No flights currently scheduled.</p>}
          <ul className="item-list">
            {flights.map((flight) => (
              <li key={flight._id} className="flight-item">
                <span className="flight-icon">✈️</span>
                <div className="flight-details">
                  <strong>{flight.flight_number}</strong>: {flight.origin} → {flight.destination}
                  <br />
                  <small>Depart: {formatDate(flight.departure_time)} | Arrive: {formatDate(flight.arrival_time)}</small>
                </div>
                <span className="flight-price">${flight.price?.toFixed(2) ?? 'N/A'}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Section: Manage Passengers & Bookings --- */}
        <div className="form-sections-grid"> {/* Grid layout for forms */}
          {/* --- Section: Add Passenger --- */}
          <section className="section">
            <h2>Add Passenger</h2>
            <form onSubmit={handleAddPassenger} className="data-form">
              <div className="form-group">
                <label htmlFor="passengerName">Full Name:</label>
                <input
                  type="text"
                  id="passengerName"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  required
                  placeholder="e.g., Jane Doe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="passengerEmail">Email:</label>
                <input
                  type="email"
                  id="passengerEmail"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  required
                  placeholder="e.g., jane.doe@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="passengerPhone">Phone (Optional):</label>
                <input
                  type="tel" // Use type="tel"
                  id="passengerPhone"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="e.g., 555-123-4567"
                />
              </div>
              <button type="submit" className="button button-primary">Add Passenger</button>
            </form>
          </section>

          {/* --- Section: Create Booking --- */}
          <section className="section">
            <h2>Create Booking</h2>
            <form onSubmit={handleAddBooking} className="data-form">
              <div className="form-group">
                <label htmlFor="selectFlight">Select Flight:</label>
                <select
                  id="selectFlight"
                  value={selectedFlightId}
                  onChange={(e) => setSelectedFlightId(e.target.value)}
                  required
                  disabled={flights.length === 0}
                >
                  <option value="" disabled>-- Select a Flight --</option>
                  {flights.map((flight) => (
                    <option key={flight._id} value={flight._id}>
                      {flight.flight_number} ({flight.origin} to {flight.destination})
                    </option>
                  ))}
                </select>
                {flights.length === 0 && !loadingFlights && <small className="hint-text">No flights available.</small>}
              </div>

              <div className="form-group">
                <label htmlFor="selectPassenger">Select Passenger:</label>
                <select
                  id="selectPassenger"
                  value={selectedPassengerId}
                  onChange={(e) => setSelectedPassengerId(e.target.value)}
                  required
                  disabled={passengers.length === 0}
                >
                  <option value="" disabled>-- Select a Passenger --</option>
                  {passengers.map((passenger) => (
                    <option key={passenger._id} value={passenger._id}>
                      {passenger.full_name} ({passenger.email})
                    </option>
                  ))}
                </select>
                {passengers.length === 0 && <small className="hint-text">Add a passenger first.</small>}
              </div>

              <button type="submit" className="button button-primary" disabled={!selectedFlightId || !selectedPassengerId}>
                Book Now
              </button>
            </form>
          </section>
        </div> {/* End form-sections-grid */}


        {/* --- Section: Existing Bookings --- */}
        <section className="section">
          <h2>Your Bookings</h2>
          {loadingBookings && <p className="loading-message">Loading bookings...</p>}
          {!loadingBookings && bookings.length === 0 && <p>You have no bookings yet.</p>}
          <ul className="item-list">
            {bookings.map((booking) => (
              <li key={booking._id} className="booking-item">
                 <span className="booking-icon">🎫</span> {/* Ticket icon */}
                 <div className="booking-details">
                   <strong>Flight: {booking.flight?.flight_number ?? 'N/A'}</strong> ({booking.flight?.origin ?? '?'} → {booking.flight?.destination ?? '?'})
                   <br />
                   Passenger: {booking.passenger?.full_name ?? 'N/A'} ({booking.passenger?.email ?? 'N/A'})
                   <br />
                   <small>Booked On: {formatDate(booking.createdAt)} (ID: {booking._id})</small>
                 </div>
              </li>
            ))}
          </ul>
        </section>

      </main> {/* End container */}

      <footer className="app-footer">
          <p>© {new Date().getFullYear()} Flight Booking System. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;