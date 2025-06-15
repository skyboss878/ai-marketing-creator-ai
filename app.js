const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load .env config
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/payments', require('./routes/payments'));

// Base route
app.get('/', (req, res) => {
  res.send('AI Marketing Creator Backend is live!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
