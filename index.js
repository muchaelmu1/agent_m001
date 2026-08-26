import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import serveai from 'Routes/serveai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample Route
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running smoothly!' });
});
app.use('/api/serveai', serveai);
app.use("/api/tasks", require("./routes/tasks"));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
