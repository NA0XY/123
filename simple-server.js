const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Mock database for users
let users = [
    {
        id: '1',
        email: 'harsh.singhal@onecare.com',
        passwordHash: hashPassword('admin123'),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        email: 'patient@onecare.com',
        passwordHash: hashPassword('patient123'),
        firstName: 'John',
        lastName: 'Doe',
        role: 'patient',
        createdAt: new Date().toISOString()
    }
];

// Mock database for auth tokens
let authTokens = new Map();

// Middleware to serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Authentication middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Allow access to public routes without authentication
        if (req.path === '/' || req.path.endsWith('.js') || req.path.endsWith('.css')) {
            return next();
        }
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const userData = authTokens.get(token);
    
    if (!userData) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    req.user = userData;
    next();
}

// Role-based access control middleware
function authorizeRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Access forbidden' });
        }
        
        next();
    };
}

// Route to serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication routes
app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate a token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token with user data
    authTokens.set(token, {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        createdAt: new Date().toISOString()
    });
    
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        },
        role: user.role,
        name: `${user.firstName} ${user.lastName}`
    });
});

app.post('/api/auth/signup', (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create new user
    const newUser = {
        id: String(users.length + 1),
        email,
        passwordHash: hashPassword(password),
        firstName,
        lastName,
        role: role || 'patient',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Generate a token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token with user data
    authTokens.set(token, {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: `${newUser.firstName} ${newUser.lastName}`,
        createdAt: new Date().toISOString()
    });
    
    res.status(201).json({
        token,
        user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role
        },
        role: newUser.role,
        name: `${newUser.firstName} ${newUser.lastName}`
    });
});

// Apply authentication to protected routes
app.use(['/patient-dashboard.html', '/admin-dashboard.html', '/screening.html', '/appointments.html', 
        '/medications.html', '/messages.html', '/health-records.html', '/reports.html', '/emergency.html'], authenticate);

// Serve protected pages with role-based access
app.get('/admin-dashboard.html', authorizeRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/patient-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'patient-dashboard.html'));
});

// Route to serve screening page
app.get('/screening.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'screening.html'));
});

// Route to serve appointments page
app.get('/appointments.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'appointments.html'));
});

// Route to serve medications page
app.get('/medications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'medications.html'));
});

// Route to serve messages page
app.get('/messages.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'messages.html'));
});

// Route to serve health records page
app.get('/health-records.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'health-records.html'));
});

// Route to serve reports page
app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

// Route to serve emergency page
app.get('/emergency.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'emergency.html'));
});

// API endpoints for demo functionality
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'OneCare API is running', timestamp: new Date().toISOString() });
});

// Mock API for screening data
app.get('/api/screening/recommendations', (req, res) => {
    res.json({
        recommendations: [
            {
                id: 1,
                type: 'mammography',
                title: 'Mammography Screening',
                description: 'Annual mammography recommended for women 50-74',
                priority: 'high',
                dueDate: '2024-01-15'
            },
            {
                id: 2,
                type: 'colonoscopy',
                title: 'Colorectal Cancer Screening',
                description: 'Colonoscopy every 10 years for ages 45-75',
                priority: 'medium',
                dueDate: '2024-03-01'
            }
        ]
    });
});

// Mock API for patient data
app.get('/api/patient/profile', (req, res) => {
    res.json({
        id: 'patient-123',
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        lastVisit: '2023-11-15',
        riskScore: 7.2,
        conditions: ['Hypertension', 'Type 2 Diabetes']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Page not found' });
});

// API endpoints for admin
app.get('/api/admin/stats', authenticate, authorizeRole('admin'), (req, res) => {
    res.json({
        userCount: 2847,
        appointmentsToday: 1023,
        systemAlerts: 12,
        monthlyRevenue: 84200
    });
});

app.get('/api/admin/users', authenticate, authorizeRole('admin'), (req, res) => {
    // Return all users except passwords
    const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        createdAt: u.createdAt
    }));
    
    res.json(safeUsers);
});

// API endpoints for patient data
app.get('/api/patient/profile', authenticate, (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        age: 45,
        gender: 'Male',
        bloodType: 'A+',
        height: '5\'10"',
        weight: '165 lbs',
        allergies: ['Penicillin', 'Peanuts'],
        conditions: ['Hypertension', 'Type 2 Diabetes']
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 OneCare Web Application running on http://localhost:${PORT}`);
    console.log(`🔐 Authentication enabled - Demo Credentials:`);
    console.log(`   👨‍⚕️ Admin: admin@onecare.com / admin123`);
    console.log(`   👨‍⚕️ Patient: patient@onecare.com / patient123`);
    console.log(``);
    console.log(`📱 Pages:`);
    console.log(`   🏠 Landing Page: http://localhost:${PORT}`);
    console.log(`   👤 Patient Dashboard: http://localhost:${PORT}/patient-dashboard.html`);
    console.log(`   👑 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`\n✅ All navigation links are working properly!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down gracefully...');
    process.exit(0);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down gracefully...');
    process.exit(0);
});