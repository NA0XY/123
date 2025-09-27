const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Mock In-Memory Database ---
const database = {
    users: [
        { id: 'admin01', name: 'Harsh Singhal', email: 'harsh.singhal@onecare.com', passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRxkZjQBjyMM5/pm', role: 'admin', lastLogin: null },
        { id: 'provider01', name: 'Dr. Evelyn Reed', email: 'e.reed@onecare.com', passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRxkZjQBjyMM5/pm', role: 'provider', specialty: 'Cardiology', lastLogin: null },
        { id: 'patient01', name: 'Jane Doe', email: 'jane.doe@email.com', passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRxkZjQBjyMM5/pm', role: 'patient', lastLogin: null },
        { id: 'patient02', name: 'Michael Scott', email: 'michael.scott@email.com', passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRxkZjQBjyMM5/pm', role: 'patient', lastLogin: null },
        { id: 'patient03', name: 'Sarah Connor', email: 'sarah.connor@email.com', passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRxkZjQBjyMM5/pm', role: 'patient', lastLogin: null },
    ],
    patients: [
        { id: 'patient01', name: 'Jane Doe', lastVisit: '2025-09-15', status: 'At Risk', age: 34, condition: 'Hypertension', allergies: 'Penicillin' },
        { id: 'patient02', name: 'Michael Scott', lastVisit: '2025-09-12', status: 'Active', age: 45, condition: 'Type 2 Diabetes', allergies: 'None' },
        { id: 'patient03', name: 'Sarah Connor', lastVisit: '2025-09-01', status: 'Active', age: 29, condition: 'Post-op Recovery', allergies: 'None' },
        { id: 'patient04', name: 'Kyle Reese', lastVisit: '2025-08-28', status: 'Discharged', age: 31, condition: 'Recovered', allergies: 'None' },
        { id: 'patient05', name: 'T-800', lastVisit: '2025-08-15', status: 'At Risk', age: 35, condition: 'General Checkup', allergies: 'None' },
    ],
    appointments: {
        '2025-09-15': [
            { time: '10:00 AM', patient: 'Michael Scott', reason: 'Pre-op Assessment', status: 'Confirmed' },
            { time: '11:30 AM', patient: 'Sarah Connor', reason: 'Follow-up', status: 'Confirmed' },
            { time: '02:00 PM', patient: 'Jane Doe', reason: 'Annual Checkup', status: 'Completed' }
        ],
        '2025-09-18': [
            { time: '09:00 AM', patient: 'T-800', reason: 'Routine Check', status: 'Confirmed' }
        ]
    },
    providerDashboard: {
        stats: {
            patients: 24,
            appointmentsToday: 3,
            pendingMessages: 2,
        },
        timeline: [
            { time: '10:00 AM', title: 'Pre-op Assessment', patient: 'Michael Scott' },
            { time: '11:30 AM', title: 'Follow-up', patient: 'Sarah Connor' },
            { time: '12:30 PM', title: 'Lunch Break' },
            { time: '02:00 PM', title: 'Annual Checkup', patient: 'Jane Doe' },
        ],
        tasks: [
            { description: 'Review lab results for Jane Doe', priority: 'High' },
            { description: 'Sign prescription renewal for Michael Scott', priority: 'Medium' },
            { description: 'Follow up with Sarah Connor post-op', priority: 'Low' },
        ],
        atRiskPatients: [
            { name: 'Jane Doe', reason: 'High Blood Pressure', lastVisit: '2025-09-15' },
            { name: 'T-800', reason: 'Missed medication', lastVisit: '2025-08-15' }
        ]
    },
    providerMessages: {
        patients: {
            'p1': { name: 'Jane Doe', avatar: 'J', avatarClass: 'avatar-1', age: 34, condition: 'Hypertension', allergies: 'Penicillin' },
            'p2': { name: 'Michael Scott', avatar: 'M', avatarClass: 'avatar-2', age: 45, condition: 'Type 2 Diabetes', allergies: 'None' },
            'p3': { name: 'Sarah Connor', avatar: 'S', avatarClass: 'avatar-3', age: 29, condition: 'Post-op Recovery', allergies: 'None' }
        },
        conversations: [
            { patientId: 'p1', lastMessage: "Thanks, I'll schedule it now.", time: '10:45 AM', unread: 2 },
            { patientId: 'p2', lastMessage: 'Should I continue with the new dosage?', time: 'Yesterday', unread: 0 },
            { patientId: 'p3', lastMessage: 'Feeling much better today!', time: '2 days ago', unread: 0 },
        ],
        messages: {
            'p1': [
                { sender: 'patient', text: 'Good morning, Dr. Reed. I have a question about my latest lab results.', time: '9:30 AM' },
                { sender: 'provider', text: 'Of course, Jane. I reviewed them, and everything looks stable. I do recommend we schedule a follow-up for next month.', time: '9:32 AM' },
                { sender: 'patient', text: "Thanks, I'll schedule it now.", time: '10:45 AM' },
            ],
            'p2': [
                { sender: 'patient', text: 'Should I continue with the new dosage?', time: 'Yesterday' },
            ]
        }
    },
    providerSettings: {
        profile: {
            fullName: 'Dr. Evelyn Reed',
            email: 'e.reed@onecare.com',
            specialty: 'Cardiology',
            phone: '+1 (555) 987-6543'
        },
        notifications: {
            newMessage: true,
            appointmentCancellation: true,
            weeklySummary: false
        }
    },
    auditLogs: [
        { id: 'log_1', userId: 'admin01', action: 'login', timestamp: new Date().toISOString(), status: 'success' },
        { id: 'log_2', userId: 'provider01', action: 'view_patient_chart', timestamp: new Date().toISOString(), status: 'success', resource: 'patient02' },
    ]
};

// --- API ENDPOINTS ---

// --- AUTHENTICATION API ---
app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = database.users.find(u => u.email === email);

        if (!user || !password) { // Basic check for password presence
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.lastLogin = new Date().toISOString();
        res.json({
            success: true,
            token: 'mock-jwt-token', // In a real app, generate a JWT
            role: user.role,
            name: user.name,
            id: user.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});


// --- PROVIDER API ENDPOINTS ---
app.get('/api/provider/dashboard', (req, res) => {
    res.json(database.providerDashboard);
});

app.get('/api/provider/patients', (req, res) => {
    res.json(database.patients);
});

app.get('/api/provider/appointments', (req, res) => {
    res.json(database.appointments);
});

app.get('/api/provider/messages', (req, res) => {
    res.json(database.providerMessages);
});

app.get('/api/provider/settings', (req, res) => {
    res.json(database.providerSettings);
});

app.post('/api/provider/settings', (req, res) => {
    const { profile, notifications } = req.body;
    if (profile) {
        database.providerSettings.profile = { ...database.providerSettings.profile, ...profile };
    }
    if (notifications) {
        database.providerSettings.notifications = { ...database.providerSettings.notifications, ...notifications };
    }
    res.json({ success: true, message: 'Settings updated successfully.', settings: database.providerSettings });
});

// --- PATIENT API ENDPOINTS ---
app.get('/api/patient/:id/screening', (req, res) => {
    const patientId = req.params.id;
    // In a real application you would fetch this data from a database
    // For this example, we'll just return some mock data.
    const patient = database.patients.find(p => p.id === patientId);

    if (patient && patient.status === 'At Risk') {
        res.json({
            recommendations: [
                {
                    title: 'Comprehensive Health Screening',
                    reason: 'Your profile indicates you are at risk. A comprehensive health screening is recommended.',
                    type: 'screening'
                },
                {
                    title: 'Lifestyle Consultation',
                    reason: 'Discuss lifestyle modifications with your provider to mitigate risks.',
                    type: 'lifestyle'
                }
            ]
        });
    } else {
        res.json({
            recommendations: [
                 {
                    title: 'Annual Physical Exam',
                    reason: 'It is recommended to have an annual physical exam to maintain good health.',
                    type: 'preventive_care'
                }
            ]
        });
    }
});


// --- ADMIN API ENDPOINTS ---
app.get('/api/admin/dashboard', (req, res) => {
    res.json({
        userStats: {
            total: database.users.length,
            admins: database.users.filter(u => u.role === 'admin').length,
            providers: database.users.filter(u => u.role === 'provider').length,
            patients: database.users.filter(u => u.role === 'patient').length,
        },
        recentActivity: database.auditLogs.slice(-5)
    });
});

// --- HTML PAGE SERVING ---
// Define all application pages
const pages = [
    'admin-dashboard', 'admin-analytics', 'admin-users', 'admin-notifications',
    'admin-audit-logs', 'admin-settings', 'admin-monitoring', 'patient-dashboard',
    'appointments', 'messages', 'patient-medications', 'patient-health-records',
    'patient-reports', 'patient-screening', 'patient-emergency', 'provider-dashboard',
    'provider-appointments', 'my-patient', 'provider-messages', 'provider-settings'
];

// Serve index.html at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create specific routes for each page BEFORE the general static file handler
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
    app.get(`/${page}.html`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

// --- STATIC FILE SERVING ---
// This serves CSS, JS, images, etc. It should come after specific page routes.
app.use(express.static(path.join(__dirname)));


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Serving static files from:', __dirname);
});