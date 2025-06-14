// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const bodyParser = require('body-parser')

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  //origin: `http://localhost:3001`, // local link 
  origin: `https://dashboard-pearl-five-74.vercel.app`, // production link 
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Route setup
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);      
app.use('/api/teams', teamRoutes);
app.use('/api/protected', protectedRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
  });
});

// Start the server
const PORT =  5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
