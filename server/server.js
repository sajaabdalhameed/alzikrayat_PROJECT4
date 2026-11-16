const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // helps when the local DNS cannot resolve mongodb+srv:// addresses
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Photo = require('./models/Photo');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/photos/:id/comments', require('./routes/commentRoutes'));
app.use('/api/photos', require('./routes/photoRoutes'));
app.get('/api/stats', async (req, res, next) => {
  try {
    res.json({ userCount: await User.countDocuments(), photoCount: await Photo.countDocuments() });
  } catch (err) { next(err); }
});
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

const port = process.env.PORT || 5000;

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGODB_URI or JWT_SECRET in server/.env');
  process.exit(1);
}

// Fail fast (10 s) with a readable message instead of hanging for minutes.
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    console.error('Check: 1) MONGODB_URI is correct  2) Atlas > Network Access allows your IP  3) your internet connection');
    process.exit(1);
  });
