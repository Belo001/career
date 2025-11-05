import express from 'express';
import cors from 'cors';
import ordersRouter from './routes/orders.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);

const PORT = 4000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
