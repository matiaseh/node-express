import express from 'express';
import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Set cookie options
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });

  // Send access token
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
    expiresIn: '1h',
  });
  res.header('auth-token', token).send({ token });
});

// Refresh Token Route
router.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).send('Access Denied');

  // Verify the refresh token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Refresh Token');

    // Generate a new access token
    const accessToken = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: '1h',
    });

    res.send({ token: accessToken });
  });
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { path: '/' });
  res.send('Logged out successfully');
});

export default router;
