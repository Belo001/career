import express from 'express';
import cors from 'cors';
import ordersRouter from './routes/orders.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/orders', ordersRouter);

// Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));