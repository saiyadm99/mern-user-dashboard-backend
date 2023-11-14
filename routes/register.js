const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

router.post('/', async (req, res) => {
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

module.exports = router;
