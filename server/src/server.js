import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import scoreRoutes from './routes/scoreRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet());
app.use(morgan('dev'));

// Configure CORS
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive in development
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB Atlas
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/reports', reportRoutes);


// Health Check Endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'offline/standby';
    res.status(200).json({
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        message: 'Capgemini Exceller Cognitive Assessment API is running.',
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        name: 'Capgemini Exceller API',
        version: '1.0.0',
        documentation: '/api/health',
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Capgemini Exceller Backend running on: http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health\n`);
});
