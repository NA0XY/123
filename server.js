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
            email: 'harsh.singhal@onecare.com',
            password: '$2a$10$rOzJJcUBl7C1tWVmz2GnfOx0YV.gxqZ9JCk4JFGJ.YVXr8LKUdJ1G', // 'admin123'
            role: 'admin',
            name: 'System Administrator',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'provider_001',
            email: 'dr.smith@hospital.com',
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
            email: 'patient@email.com',
            password: '$2a$10$rOzJJcUBl7C1tWVmz2GnfOx0YV.gxqZ9JCk4JFGJ.YVXr8LKUdJ1G', // 'patient123'
            role: 'patient',
            name: 'John Doe',
            dateOfBirth: '1990-05-15',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
        }
    ],
    appointments: [
        {
            id: 'apt_001',
            patientId: 'patient_001',
            providerId: 'provider_001',
            title: 'Regular Checkup',
            description: 'Annual health screening and consultation',
            startTime: '2024-01-20T10:00:00Z',
            endTime: '2024-01-20T10:30:00Z',
            status: 'scheduled',
            type: 'consultation',
            createdAt: new Date().toISOString()
        }
    ],
    notifications: [
        {
            id: 'notif_001',
            title: 'Welcome to OneCare',
            message: 'Your healthcare management platform is ready to use.',
            type: 'info',
            priority: 'low',
            recipients: ['all'],
            status: 'sent',
            createdAt: new Date().toISOString(),
            createdBy: 'admin_001'
        }
    ],
    auditLogs: [
        {
            id: 'log_001',
            userId: 'admin_001',
            action: 'login',
            resource: 'Admin Dashboard',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date().toISOString(),
            status: 'success',
            details: 'Successful admin login'
        }
    ],
    healthData: [
        {
            id: 'health_001',
            patientId: 'patient_001',
            type: 'vital_signs',
            data: {
                bloodPressure: { systolic: 120, diastolic: 80 },
                heartRate: 72,
                temperature: 98.6,
                weight: 170,
                height: 70
            },
            timestamp: new Date().toISOString(),
            recordedBy: 'provider_001'
        }
    ],
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Audit logging middleware
const auditLog = (action, resource) => {
    return (req, res, next) => {
        const logEntry = {
            id: `log_${Date.now()}`,
            userId: req.user ? req.user.id : 'anonymous',
            action: action,
            resource: resource,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
            status: 'pending',
            details: `${action} ${resource}`
        };

        // Add to audit log after response
        res.on('finish', () => {
            logEntry.status = res.statusCode < 400 ? 'success' : 'error';
            database.auditLogs.push(logEntry);
        });

        next();
    };
};

// Routes

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication routes
app.post('/api/auth/signin', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // Find user
        const user = database.users.find(u => u.email === email && u.role === role);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log successful login
        database.auditLogs.push({
            id: `log_${Date.now()}`,
            userId: user.id,
            action: 'login',
            resource: 'Authentication',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
            status: 'success',
            details: `Successful ${role} login`
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role = 'patient' } = req.body;

    try {
        // Check if user exists
        const existingUser = database.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: `${role}_${Date.now()}`,
            email,
            password: hashedPassword,
            name,
            role,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        database.users.push(newUser);

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User management routes (Admin only)
app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), auditLog('view', 'users'), (req, res) => {
    const users = database.users.map(user => ({
        ...user,
        password: undefined // Don't send passwords
    }));
    res.json({ success: true, data: users, total: users.length });
});

app.post('/api/admin/users', authenticateToken, authorizeRole(['admin']), auditLog('create', 'user'), async (req, res) => {
    const { email, password, name, role } = req.body;

    try {
        // Check if user exists
        const existingUser = database.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: `${role}_${Date.now()}`,
            email,
            password: hashedPassword,
            name,
            role,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        database.users.push(newUser);

        res.json({ success: true, data: { ...newUser, password: undefined } });

    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/admin/users/:id', authenticateToken, authorizeRole(['admin']), auditLog('update', 'user'), (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    const userIndex = database.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    database.users[userIndex] = { ...database.users[userIndex], ...updates };
    
    res.json({ success: true, data: { ...database.users[userIndex], password: undefined } });
});

app.delete('/api/admin/users/:id', authenticateToken, authorizeRole(['admin']), auditLog('delete', 'user'), (req, res) => {
    const userId = req.params.id;

    const userIndex = database.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    database.users.splice(userIndex, 1);
    res.json({ success: true, message: 'User deleted successfully' });
});

// Analytics routes
app.get('/api/admin/analytics', authenticateToken, authorizeRole(['admin']), auditLog('view', 'analytics'), (req, res) => {
    const analytics = {
        totalUsers: database.users.length,
        totalAppointments: database.appointments.length,
        activeUsers: database.users.filter(u => u.isActive).length,
        monthlyRevenue: 284200,
        patientSatisfaction: 4.8,
        userGrowth: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            newUsers: [65, 89, 125, 156, 178, 234],
            activeUsers: [45, 67, 98, 123, 145, 189]
        },
        userDistribution: {
            patients: database.users.filter(u => u.role === 'patient').length,
            providers: database.users.filter(u => u.role === 'provider').length,
            admins: database.users.filter(u => u.role === 'admin').length
        }
    };

    res.json({ success: true, data: analytics });
});

// Notifications routes
app.get('/api/admin/notifications', authenticateToken, authorizeRole(['admin']), (req, res) => {
    res.json({ success: true, data: database.notifications });
});

app.post('/api/admin/notifications', authenticateToken, authorizeRole(['admin']), auditLog('create', 'notification'), (req, res) => {
    const { title, message, type, priority, recipients, deliveryMethod } = req.body;

    const notification = {
        id: `notif_${Date.now()}`,
        title,
        message,
        type,
        priority,
        recipients,
        deliveryMethod,
        status: 'sent',
        createdAt: new Date().toISOString(),
        createdBy: req.user.id
    };

    database.notifications.push(notification);

    // Emit real-time notification
    io.emit('new-notification', notification);

    res.json({ success: true, data: notification });
});

// Audit logs routes
app.get('/api/admin/audit-logs', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { dateRange, actionType, userRole, search } = req.query;
    let logs = [...database.auditLogs];

    // Apply filters
    if (actionType) {
        logs = logs.filter(log => log.action === actionType);
    }

    if (search) {
        logs = logs.filter(log => 
            log.details.toLowerCase().includes(search.toLowerCase()) ||
            log.resource.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, data: logs, total: logs.length });
});

// System monitoring routes
app.get('/api/admin/system-metrics', authenticateToken, authorizeRole(['admin']), (req, res) => {
    // Simulate real-time metrics
    database.systemMetrics.serverUptime = 99.5 + Math.random() * 0.4;
    database.systemMetrics.databasePerformance = 90 + Math.random() * 8;
    database.systemMetrics.memoryUsage = 60 + Math.random() * 20;
    database.systemMetrics.networkLatency = 30 + Math.random() * 30;
    database.systemMetrics.totalRequests++;

    res.json({ success: true, data: database.systemMetrics });
});

// Health data routes
app.get('/api/patient/health-data', authenticateToken, authorizeRole(['patient', 'provider', 'admin']), (req, res) => {
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;
    const healthData = database.healthData.filter(data => data.patientId === patientId);
    
    res.json({ success: true, data: healthData });
});

app.post('/api/patient/health-data', authenticateToken, authorizeRole(['patient', 'provider']), (req, res) => {
    const { type, data } = req.body;
    const patientId = req.user.role === 'patient' ? req.user.id : req.body.patientId;

    const healthRecord = {
        id: `health_${Date.now()}`,
        patientId,
        type,
        data,
        timestamp: new Date().toISOString(),
        recordedBy: req.user.id
    };

    database.healthData.push(healthRecord);
    res.json({ success: true, data: healthRecord });
});

// Appointments routes
app.get('/api/appointments', authenticateToken, (req, res) => {
    let appointments = [...database.appointments];

    // Filter based on user role
    if (req.user.role === 'patient') {
        appointments = appointments.filter(apt => apt.patientId === req.user.id);
    } else if (req.user.role === 'provider') {
        appointments = appointments.filter(apt => apt.providerId === req.user.id);
    }

    res.json({ success: true, data: appointments });
});

app.post('/api/appointments', authenticateToken, (req, res) => {
    const { patientId, providerId, title, description, startTime, endTime, type } = req.body;

    const appointment = {
        id: `apt_${Date.now()}`,
        patientId: req.user.role === 'patient' ? req.user.id : patientId,
        providerId,
        title,
        description,
        startTime,
        endTime,
        status: 'scheduled',
        type,
        createdAt: new Date().toISOString()
    };

    database.appointments.push(appointment);

    // Emit real-time update
    io.emit('new-appointment', appointment);

    res.json({ success: true, data: appointment });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room based on user role
    socket.on('join-room', (data) => {
        const { userId, role } = data;
        socket.join(`${role}s`); // Join patients, providers, or admins room
        socket.userId = userId;
        socket.userRole = role;

        // Send active user count to admins
        io.to('admins').emit('active-users-update', {
            count: io.sockets.sockets.size,
            timestamp: new Date().toISOString()
        });
    });

    // Handle real-time monitoring updates
    socket.on('request-metrics', () => {
        if (socket.userRole === 'admin') {
            // Send real-time system metrics
            setInterval(() => {
                socket.emit('system-metrics-update', database.systemMetrics);
            }, 5000);
        }
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
        const { recipientId, message, type } = data;
        
        // Broadcast message to recipient
        socket.to(recipientId).emit('new-message', {
            senderId: socket.userId,
            message,
            type,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Update active user count
        io.to('admins').emit('active-users-update', {
            count: io.sockets.sockets.size - 1,
            timestamp: new Date().toISOString()
        });
    });
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
    console.log(`🏥 OneCare Healthcare Platform Server running on port ${PORT}`);
    console.log(`📱 Dashboard: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`📊 WebSocket: Enabled for real-time features`);
    
    // Initialize sample data
    console.log(`👥 Sample Users: ${database.users.length} (admin@onecare.com / admin123)`);
    console.log(`📅 Sample Appointments: ${database.appointments.length}`);
    console.log(`🔔 Sample Notifications: ${database.notifications.length}`);
});

module.exports = { app, server, io, database };