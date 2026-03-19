const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const dotenv = require('dotenv');

dotenv.config();
const port =  process.env.PORT || 3000;

const connectDB = require('./connectDB/connectDB');
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../front')));

app.get('/', (req, res) => {    
    res.sendFile(path.join(__dirname, '../front/index.html'));
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


    