import express from 'express';
import User from '../model/User.js';
import verify from './verifyToken.js';

const router = express.Router();

router.get('/me', verify, async (req, res) => {
  try {
    // request.user is getting fetched from Middleware after token authentication
    const user = await User.findById(req.user._id);
    res.status(200).json({ user_id: user._id });
  } catch (e) {
    res.send({ message: 'Error fetching user' });
  }
});

// Get list of all users
router.get('/', verify, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password from response
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching users', error: error.message });
  }
});

// Get the profile of a specific user
router.get('/:user_id', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password from response
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching users', error: error.message });
  }
});

export default router;
