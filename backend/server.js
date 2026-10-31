require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const initDB = require('./src/database/init');
const authRoutes = require('./src/routes/authRoutes');
const simulationRoutes = require('./src/routes/simulationRoutes');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Initialize Database
const db = initDB();
if (!db) {
    console.error('[Server] WARNING: Database failed to initialize. Features relying on DB will not work.');
}
app.set('db', db);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'HoneySwarm Backend',
        timestamp: new Date().toISOString(),
        db: db ? 'connected' : 'failed'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/simulation', simulationRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`[Server] HoneySwarm backend running on port ${PORT}`);
});