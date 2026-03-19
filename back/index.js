const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const connectDB = require('./connectDB/connectDB');
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../front')));

app.get('/', (req, res) => {    
    res.sendFile(path.join(__dirname, '../front/index.html'));
});

module.exports = app;