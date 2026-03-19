import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import connectDB from './connectDB/connectDB.js';

const app = express();

// équivalent de __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const port = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());

// ⚠️ chemins
app.use(express.static(path.join(__dirname, '../front')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../front/index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});