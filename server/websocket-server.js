const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use(express.json());

// JWT verification middleware for socket connections
const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error'));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'onecare-secret-key');
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Invalid token'));
    }
};

// Use authentication middleware
io.use(authenticateSocket);

// Store connected users by role
const connectedUsers = {
    admins: new Map(),
    providers: new Map(),
    patients: new Map()
};

// Real-time system monitoring data
let systemMetrics = {
    activeUsers: 0,
    serverUptime: Date.now(),
    responseTime: 45,
    errorRate: 0.02,
    memoryUsage: 68.5,
    cpuUsage: 32.1,
    databaseConnections: 15
};

// Mock real-time notifications queue
let notificationsQueue = [
    {
        id: 'notif_001',
        type: 'appointment_reminder',
        title: 'Upcoming Appointment',
        message: 'You have an appointment in 30 minutes with Dr. Smith',
        priority: 'high',
        timestamp: new Date(),
        userId: 'user_123',
        userRole: 'patient'
    },
    {
        id: 'notif_002',
        type: 'system_alert',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will begin at 2:00 AM EST',
        priority: 'medium',
        timestamp: new Date(),
        userId: 'admin_001',
        userRole: 'admin'
    }
];

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId} (${socket.user.role})`);
    
    // Store user connection by role
    connectedUsers[`${socket.user.role}s`].set(socket.user.userId, socket);
    
    // Update active users count
    systemMetrics.activeUsers = getTotalConnectedUsers();
    
    // Send initial data based on user role
    switch (socket.user.role) {
        case 'admin':
            socket.emit('system_metrics', systemMetrics);
            socket.emit('notifications', getNotificationsForUser(socket.user.userId, socket.user.role));
            break;
        case 'provider':
            socket.emit('patient_updates', getPatientUpdatesForProvider(socket.user.userId));
            socket.emit('notifications', getNotificationsForUser(socket.user.userId, socket.user.role));
            break;
        case 'patient':
            socket.emit('appointment_updates', getAppointmentUpdatesForPatient(socket.user.userId));
            socket.emit('notifications', getNotificationsForUser(socket.user.userId, socket.user.role));
            break;
    }
    
    // Join user to their personal room
    socket.join(`user_${socket.user.userId}`);
    socket.join(`role_${socket.user.role}`);
    
    // Handle real-time chat messages
    socket.on('send_message', (data) => {
        const message = {
            id: `msg_${Date.now()}`,
            senderId: socket.user.userId,
            senderName: socket.user.name,
            recipientId: data.recipientId,
            content: data.content,
            timestamp: new Date(),
            type: data.type || 'text'
        };
        
        // Send message to recipient
        io.to(`user_${data.recipientId}`).emit('new_message', message);
        
        // Confirm message sent to sender
        socket.emit('message_sent', message);
        
        console.log(`Message sent from ${socket.user.userId} to ${data.recipientId}`);
    });
    
    // Handle appointment status updates
    socket.on('appointment_update', (data) => {
        const update = {
            appointmentId: data.appointmentId,
            status: data.status,
            timestamp: new Date(),
            updatedBy: socket.user.userId
        };
        
        // Notify all relevant parties
        if (data.patientId) {
            io.to(`user_${data.patientId}`).emit('appointment_status_changed', update);
        }
        if (data.providerId) {
            io.to(`user_${data.providerId}`).emit('appointment_status_changed', update);
        }
        
        // Notify admins
        broadcastToRole('admin', 'appointment_update', update);
        
        console.log(`Appointment ${data.appointmentId} updated to ${data.status}`);
    });
    
    // Handle emergency alerts
    socket.on('emergency_alert', (data) => {
        const alert = {
            id: `alert_${Date.now()}`,
            type: 'emergency',
            severity: data.severity || 'high',
            message: data.message,
            location: data.location,
            patientId: data.patientId,
            timestamp: new Date()
        };
        
        // Notify all providers and admins
        broadcastToRole('provider', 'emergency_alert', alert);
        broadcastToRole('admin', 'emergency_alert', alert);
        
        console.log(`Emergency alert: ${alert.message}`);
    });
    
    // Handle system monitoring requests
    socket.on('request_system_metrics', () => {
        if (socket.user.role === 'admin') {
            socket.emit('system_metrics', systemMetrics);
        }
    });
    
    // Handle user status updates
    socket.on('update_status', (status) => {
        socket.user.status = status;
        
        // Notify relevant users about status change
        socket.broadcast.emit('user_status_changed', {
            userId: socket.user.userId,
            status: status,
            timestamp: new Date()
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.userId} (${socket.user.role})`);
        
        // Remove user from connected users
        connectedUsers[`${socket.user.role}s`].delete(socket.user.userId);
        
        // Update active users count
        systemMetrics.activeUsers = getTotalConnectedUsers();
        
        // Broadcast updated metrics to admins
        broadcastToRole('admin', 'system_metrics', systemMetrics);
    });
});

// Helper functions
function getTotalConnectedUsers() {
    return connectedUsers.admins.size + connectedUsers.providers.size + connectedUsers.patients.size;
}

function broadcastToRole(role, event, data) {
    connectedUsers[`${role}s`].forEach((socket) => {
        socket.emit(event, data);
    });
}

function getNotificationsForUser(userId, role) {
    return notificationsQueue.filter(notif => 
        notif.userId === userId || notif.userRole === role
    );
}

function getPatientUpdatesForProvider(providerId) {
    // Mock patient updates for the provider
    return [
        {
            patientId: 'patient_001',
            patientName: 'John Doe',
            status: 'vitals_updated',
            vitals: { heartRate: 72, bloodPressure: '120/80', temperature: 98.6 },
            timestamp: new Date(Date.now() - 300000) // 5 minutes ago
        },
        {
            patientId: 'patient_002',
            patientName: 'Mary Johnson',
            status: 'medication_taken',
            medication: 'Blood pressure medication',
            timestamp: new Date(Date.now() - 600000) // 10 minutes ago
        }
    ];
}

function getAppointmentUpdatesForPatient(patientId) {
    // Mock appointment updates for the patient
    return [
        {
            appointmentId: 'apt_001',
            providerId: 'provider_001',
            providerName: 'Dr. Smith',
            status: 'confirmed',
            scheduledTime: new Date(Date.now() + 1800000), // 30 minutes from now
            timestamp: new Date()
        }
    ];
}

// Simulate real-time system metrics updates
setInterval(() => {
    // Update mock metrics
    systemMetrics.responseTime = Math.floor(Math.random() * 100) + 20;
    systemMetrics.errorRate = Math.random() * 0.1;
    systemMetrics.memoryUsage = Math.random() * 40 + 50;
    systemMetrics.cpuUsage = Math.random() * 60 + 20;
    systemMetrics.databaseConnections = Math.floor(Math.random() * 20) + 10;
    
    // Broadcast to all admins
    broadcastToRole('admin', 'system_metrics', systemMetrics);
}, 5000); // Update every 5 seconds

// Simulate periodic notifications
setInterval(() => {
    const newNotification = {
        id: `notif_${Date.now()}`,
        type: 'system_update',
        title: 'System Status',
        message: `System running smoothly. ${systemMetrics.activeUsers} active users.`,
        priority: 'low',
        timestamp: new Date(),
        userRole: 'admin'
    };
    
    notificationsQueue.push(newNotification);
    
    // Broadcast to all admins
    broadcastToRole('admin', 'new_notification', newNotification);
    
    // Keep only last 50 notifications
    if (notificationsQueue.length > 50) {
        notificationsQueue = notificationsQueue.slice(-50);
    }
}, 30000); // Every 30 seconds

// REST API endpoints for WebSocket integration
app.post('/api/broadcast', (req, res) => {
    const { role, event, data } = req.body;
    
    if (role && event && data) {
        broadcastToRole(role, event, data);
        res.json({ success: true, message: 'Broadcast sent' });
    } else {
        res.status(400).json({ error: 'Missing required fields: role, event, data' });
    }
});

app.get('/api/connected-users', (req, res) => {
    res.json({
        total: getTotalConnectedUsers(),
        admins: connectedUsers.admins.size,
        providers: connectedUsers.providers.size,
        patients: connectedUsers.patients.size
    });
});

app.get('/api/system-metrics', (req, res) => {
    res.json(systemMetrics);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date(),
        connectedUsers: getTotalConnectedUsers()
    });
});

const PORT = process.env.WEBSOCKET_PORT || 3002;

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log('Real-time features enabled:');
    console.log('- Live chat messaging');
    console.log('- System monitoring');
    console.log('- Real-time notifications');
    console.log('- Appointment updates');
    console.log('- Emergency alerts');
});

module.exports = { app, server, io };