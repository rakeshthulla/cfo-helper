const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your MongoDB Atlas URI
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  history: [
    {
      simulationType: String,
      hiring: Number,
      marketing: Number,
      priceIncrease: Number,
      revenue: Number,
      expenses: Number,
      profit: Number,
      runway: String,
      suggestion: String,
      date: String
    }
  ]
});
const User = mongoose.model('User', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'User exists' });
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.json({ message: 'Signup successful' });
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  // Optionally, generate JWT token here
  res.json({ message: 'Login successful' });
});

app.listen(3001, () => console.log('Server running on port 3001'));

// Save simulation history for a user
app.post('/save-history', async (req, res) => {
  const { username, entry } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });
  user.history = user.history || [];
  user.history.unshift(entry);
  await user.save();
  res.json({ message: 'History saved' });
});

// Get user history
app.post('/get-history', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });
  res.json({ history: user.history });
});