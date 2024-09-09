import express from 'express';
import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import verify from './verifyToken.js';
import { registerValidation, loginValidation } from '../validation.js';
import sendVerificationEmail from '../sendVerificationEmail.js';
import crypto from 'crypto';

const router = express.Router();

// Registration Routes
router.post('/register', async (req, res) => {
  try {
    const validation = registerValidation(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }

    // Check if the user is already in the database
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).send('Email already exists');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationUrl = `${process.env.FRONTEND_APP_URL}/verify/${verificationToken}`;

    // Send verification email
    try {
      await sendVerificationEmail(req.body.email, verificationUrl);
    } catch (error) {
      console.error('Error sending verification email:', error);
      return res.status(500).send('Error sending verification email');
    }

    // Create a new user if the email was sent successfully
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      verificationToken: verificationToken,
    });

    const savedUser = await user.save();

    // Send success response
    res.send({
      user: user._id,
      message: 'Verification email sent, please check your inbox',
    });
  } catch (error) {
    console.error('Error during registration:', error);
  }
});

// Verify user
router.get('/verify/:token', async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });
  if (!user) return res.status(400).send('Invalid token');

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.send('Email successfully verified');
});

//Login routes
router.post('/login', async (req, res) => {
  //Validate data before making user
  const validation = loginValidation(req.body);
  if (validation.error) {
    return res.status(400).send(validation.error.details[0].message);
  }

  //Checking if the email already exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('Email not found');

  // Check if the password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send('Password is wrong');

  // Check if user has verified their email
  if (!user.isVerified)
    return res.status(400).send('Please verify your email before logging in');

  //Create and assign token
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
  res.header('auth-token', token).send({ token: token });
});

router.get('/me', verify, async (req, res) => {
  try {
    // request.user is getting fetched from Middleware after token authentication
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
  } catch (e) {
    res.send({ message: 'Error fetching user' });
  }
});

export default router;
