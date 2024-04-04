require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');

app.get('/', (req, res) => {
  res.send('Hello World');
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
})
.catch(() => {
    console.log('Error connecting to database');
});
