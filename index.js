require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: `https://dashboard-pearl-five-74.vercel.app/`, // production link -> https://dashboard-pearl-five-74.vercel.app/
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});