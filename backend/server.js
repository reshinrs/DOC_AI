const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

// --- INITIAL SETUP ---

// Ensure the 'uploads' directory exists for file storage
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("✅ 'uploads' directory created.");
}

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration for the frontend client
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Adjust this to your frontend's URL
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
});

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected...'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- MIDDLEWARE ---

// Enable Cross-Origin Resource Sharing (CORS)
// Expose 'Content-Disposition' header to allow clients to read filenames for downloads
app.use(cors({
    exposeHeaders: ['Content-Disposition'],
}));

// Parse incoming JSON requests
app.use(express.json());

// Attach the Socket.IO instance to each request object
// This makes it accessible in route handlers (e.g., req.io.emit(...))
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Serve files from the 'uploads' directory statically
app.use('/uploads', express.static(uploadsDir));


// --- API ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // Added admin route


// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // You can define custom socket events here, for example:
    // socket.on('join_room', (room) => {
    //   socket.join(room);
    //   console.log(`User ${socket.id} joined room: ${room}`);
    // });

    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
    });
});


// --- START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));