const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const protectedRoute = require('./routes/protectedRoute');

app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.use('/api', protectedRoute);

module.exports = app;
