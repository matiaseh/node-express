import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoute from './routes/auth.js';
import usersRoute from './routes/users.js';
import postRoute from './routes/posts.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to DB
const connectToDatabase = async () => {
  try {
    const dbUrl =
      process.env.NODE_ENV === 'test'
        ? process.env.DB_TEST_CONNECT
        : process.env.DB_CONNECT;
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');
  } catch (err) {
    console.error('Failed to connect to DB', err);
  }
};

connectToDatabase();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_APP_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Route middleware
app.use('/api/user', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/posts', postRoute);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
