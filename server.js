const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://user-dashboard-23.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// User model with hashed password
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  profession: String,
  interests: [String],
  bio: String,
});

const User = mongoose.model('User', userSchema);

// Middleware for user authentication with JWT
const authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Authentication failed - Token not provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed - User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Authentication failed - Invalid token' });
  }
};

// Routes
// Public route: Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password, profession, interests, bio } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      profession,
      interests,
      bio,
    });

    const savedUser = await newUser.save();
    
		// Automatically log in the user by generating a JWT token
    const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET);
    res.status(201).json({message: 'Register successful', userId: savedUser._id, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login route with JWT
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed - User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Authentication failed - Incorrect password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ message: 'Login successful', userId: user._id, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Protected routes with authentication middleware
// Get the current user's data
app.get('/users/:id', authenticateUser, async (req, res) => {
  try {
		// Check if the requested user ID matches the authenticated user's ID
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized - You are not allowed to access this user\'s data' });
    }

    res.json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update the current user's data
app.put('/users/:id', authenticateUser, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete the current user's account
app.delete('/users/:id', authenticateUser, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (deletedUser) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
