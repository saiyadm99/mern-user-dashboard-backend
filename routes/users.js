const express = require('express');
const User = require('../models/user'); // Import the User model
const authenticateUser = require('../middleware/authenticateUser'); // Import the authentication middleware

const router = express.Router();

// Public route to  get all user's data
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Protected routes with authentication middleware
// Get user data 
router.get('/:id', authenticateUser, async (req, res) => {
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

 // Update user data 
router.put('/:id', authenticateUser, async (req, res) => {
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

// Delete user
router.delete('/:id', authenticateUser, async (req, res) => {
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

module.exports = router;
