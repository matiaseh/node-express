const express = require('express')
const app = express()
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const port = process.env.PORT || 5000;
const cors = require('cors')
// Import Routes
const authRoute = require('./routes/auth')
const postRoute = require('./routes/posts')
dotenv.config()

//Connect to DB
const connectToDatabase = async () => {
    try {
      mongoose.connect(process.env.DB_CONNECT, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to DB");
    } catch (err) {
      console.error("Failed to connect to DB", err);
    }
};

connectToDatabase();

//Middleware
app.use(express.json())
app.use(cors({
    origin: process.env.FRONTEND_APP_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

//Route middleware 
app.use('/api/user', authRoute);
app.use('/api/posts', postRoute);

app.get('/', function (req, res) {
  res.send("hello World")
});
 
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});