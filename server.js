const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'onecare-healthcare-platform-secret-key';

// In-memory database simulation
const database = {
    users: [
        {
            id: 'admin_001',
            email: 'admin@onecare.com',
            // NOTE: Password check is disabled, but hash is kept for future use.
            password: '$2a$10$rOzJJcUBl7C1tWVmz2GnfOx0YV.gxqZ9JCk4JFGJ.YVXr8LKUdJ1G', // 'admin123'
            role: 'admin',
            name: 'System Administrator',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'provider_001',
            email: 'doctor@onecare.com',
            password: '$2a$10$rOzJJcUBl7C1tWVmz2GnfOx0YV.gxqZ9JCk4JFGJ.YVXr8LKUdJ1G', // 'doctor123'
            role: 'provider',
            name: 'Dr. John Smith',
            specialization: 'Cardiology',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'patient_001',
            email: 'patient@onecare.com',
            password: '$2a$10$rOzJJcUBl7C1tWVmz2GnfOx0YV.gxqZ9JCk4JFGJ.YVXr8LKUdJ1G', // 'patient123'
            role: 'patient',
            name: 'John Doe',
            dateOfBirth: '1990-05-15',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
        }
    ],
    appointments: [],
    notifications: [],
    auditLogs: [],
    healthData: [],
    systemMetrics: {
        serverUptime: 99.8,
        databasePerformance: 94.2,
        memoryUsage: 68,
        networkLatency: 45,
        activeUsers: 1247,
        totalRequests: 0,
        errorRate: 0.02
    }
};

// --- AUTHENTICATION DISABLED FOR PROTOTYPE ---
// The original authenticateToken and authorizeRole middleware are removed.
// You can add them back here when you are ready to implement security.

// Routes

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- MODIFIED AUTHENTICATION ROUTE (NO PASSWORD CHECK) ---
app.post('/api/auth/signin', async (req, res) => {
    const { email } = req.body;

    try {
        // Find user by email. If not found, default to the first user for prototype purposes.
        const user = database.users.find(u => u.email === email) || database.users.find(u => u.role === 'patient');
        
        if (!user) {
             return res.status(404).json({ error: 'No users found in the mock database.' });
        }

        // Generate a dummy token for the session
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token, // Frontend will store this token
            role: user.role,
            name: user.name,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Login process failed on the server.' });
    }
});


app.post('/api/auth/signup', async (req, res) => {
    // This route can remain as is for now, or be simplified if needed.
    const { email, password, name, role = 'patient' } = req.body;
    res.status(201).json({ success: true, message: "Signup functionality placeholder."});
});

// --- ALL OTHER ROUTES ARE NOW PUBLIC FOR THE PROTOTYPE ---

// User management routes
app.get('/api/admin/users', (req, res) => {
    const users = database.users.map(user => ({
        ...user,
        password: undefined
    }));
    res.json({ success: true, data: users, total: users.length });
});

// Analytics routes
app.get('/api/admin/analytics', (req, res) => {
     const analytics = {
        totalUsers: database.users.length,
        totalAppointments: database.appointments.length,
        activeUsers: database.users.filter(u => u.isActive).length,
        monthlyRevenue: 284200,
        patientSatisfaction: 4.8
    };
    res.json({ success: true, data: analytics });
});

// Notifications routes
app.get('/api/admin/notifications', (req, res) => {
    res.json({ success: true, data: database.notifications });
});

// Audit logs routes
app.get('/api/admin/audit-logs', (req, res) => {
    res.json({ success: true, data: database.auditLogs, total: database.auditLogs.length });
});

// System monitoring routes
app.get('/api/admin/system-metrics', (req, res) => {
    res.json({ success: true, data: database.systemMetrics });
});

// Health data routes
app.get('/api/patient/health-data', (req, res) => {
    res.json({ success: true, data: database.healthData });
});

// Appointments routes
app.get('/api/appointments', (req, res) => {
    res.json({ success: true, data: database.appointments });
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
server.listen(PORT, () => {
    console.log(`🏥 OneCare Server (NO AUTH) running on port ${PORT}`);
});

module.exports = { app, server, io, database };
