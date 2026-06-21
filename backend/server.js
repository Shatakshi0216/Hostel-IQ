require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({ origin: '*' })); // Allow cross-origin requests
app.use(express.json());

const path = require('path');

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/complaints', complaintRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  // Base route for development
  app.get('/', (req, res) => {
    res.send('HostelIQ Smart Allocation API is running...');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
