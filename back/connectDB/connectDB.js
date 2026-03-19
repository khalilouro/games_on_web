const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.DB_URL) {
            console.log("❌ DB_URL est undefined");
        }

        const conn = await mongoose.connect(process.env.DB_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
    }
};

module.exports = connectDB