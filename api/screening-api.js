/**
 * OneCare Screening & Care Plan API
 * RESTful endpoints for managing screening tests, care plans, and ML recommendations
 * Features: Authentication, authorization, audit logging, data validation
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
const { body, validationResult, param } = require('express-validator');

class OneCareScreeningAPI {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        
        // Database mock - in production would use PostgreSQL, MongoDB, etc.
        this.database = {
            users: new Map(),
            screenings: new Map(),
            carePlans: new Map(),
            mlAssessments: new Map(),
            auditLogs: []
        };
        
        // JWT secret - in production would be from environment
        this.jwtSecret = process.env.JWT_SECRET || 'onecare-screening-secret-key-2024';
        
        // Initialize logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'screening-api' },
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeData();
    }
    
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            next();
        });
    }
    
    setupRoutes() {
        // Authentication routes
        this.app.post('/api/auth/login', this.validateLogin, this.login.bind(this));
        this.app.post('/api/auth/register', this.validateRegistration, this.register.bind(this));
        this.app.post('/api/auth/refresh', this.authenticateToken, this.refreshToken.bind(this));
        
        // Screening routes
        this.app.get('/api/screenings', this.authenticateToken, this.getScreenings.bind(this));
        this.app.get('/api/screenings/:id', this.authenticateToken, this.validateScreeningId, this.getScreening.bind(this));
        this.app.post('/api/screenings', this.authenticateToken, this.validateScreeningData, this.createScreening.bind(this));
        this.app.put('/api/screenings/:id', this.authenticateToken, this.validateScreeningId, this.validateScreeningData, this.updateScreening.bind(this));
        this.app.delete('/api/screenings/:id', this.authenticateToken, this.validateScreeningId, this.deleteScreening.bind(this));
        this.app.post('/api/screenings/:id/schedule', this.authenticateToken, this.validateScreeningId, this.scheduleScreening.bind(this));
        this.app.post('/api/screenings/:id/results', this.authenticateToken, this.validateScreeningId, this.updateScreeningResults.bind(this));
        
        // Care Plan routes
        this.app.get('/api/care-plans', this.authenticateToken, this.getCarePlans.bind(this));
        this.app.get('/api/care-plans/:id', this.authenticateToken, this.validateCarePlanId, this.getCarePlan.bind(this));
        this.app.post('/api/care-plans', this.authenticateToken, this.validateCarePlanData, this.createCarePlan.bind(this));
        this.app.put('/api/care-plans/:id', this.authenticateToken, this.validateCarePlanId, this.validateCarePlanData, this.updateCarePlan.bind(this));
        this.app.delete('/api/care-plans/:id', this.authenticateToken, this.validateCarePlanId, this.deleteCarePlan.bind(this));
        this.app.post('/api/care-plans/:id/goals/:goalId/toggle', this.authenticateToken, this.toggleGoal.bind(this));
        
        // ML Assessment routes
        this.app.post('/api/ml/risk-assessment', this.authenticateToken, this.validateRiskAssessmentData, this.calculateRiskAssessment.bind(this));
        this.app.get('/api/ml/recommendations', this.authenticateToken, this.getRecommendations.bind(this));
        this.app.post('/api/ml/feedback', this.authenticateToken, this.submitMLFeedback.bind(this));
        
        // Data export routes
        this.app.get('/api/export/screenings', this.authenticateToken, this.exportScreenings.bind(this));
        this.app.get('/api/export/care-plans', this.authenticateToken, this.exportCarePlans.bind(this));
        
        // Admin routes
        this.app.get('/api/admin/audit-logs', this.authenticateToken, this.requireAdminRole, this.getAuditLogs.bind(this));
        this.app.get('/api/admin/statistics', this.authenticateToken, this.requireAdminRole, this.getStatistics.bind(this));
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
    }
    
    // Authentication middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        
        jwt.verify(token, this.jwtSecret, (err, user) => {
            if (err) {
                this.logger.warn('Invalid token attempt', { ip: req.ip, token: token.substring(0, 20) });
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    }
    
    requireAdminRole(req, res, next) {
        if (req.user.role !== 'admin') {
            this.auditLog(req.user.id, 'UNAUTHORIZED_ADMIN_ACCESS', req.path);
            return res.status(403).json({ error: 'Admin role required' });
        }
        next();
    }
    
    // Validation middleware
    validateLogin = [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        this.handleValidationErrors
    ];
    
    validateRegistration = [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
        body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
        body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
        this.handleValidationErrors
    ];
    
    validateScreeningId = [
        param('id').isUUID().withMessage('Invalid screening ID format'),
        this.handleValidationErrors
    ];
    
    validateCarePlanId = [
        param('id').isUUID().withMessage('Invalid care plan ID format'),
        this.handleValidationErrors
    ];
    
    validateScreeningData = [
        body('name').trim().isLength({ min: 1 }).withMessage('Screening name is required'),
        body('category').isIn(['cancer', 'cardiovascular', 'metabolic', 'bone-health', 'preventive']).withMessage('Invalid category'),
        body('frequency').optional().isInt({ min: 1 }).withMessage('Frequency must be a positive integer'),
        this.handleValidationErrors
    ];
    
    validateCarePlanData = [
        body('name').trim().isLength({ min: 1 }).withMessage('Care plan name is required'),
        body('condition').trim().isLength({ min: 1 }).withMessage('Condition is required'),
        body('goals').isArray().withMessage('Goals must be an array'),
        this.handleValidationErrors
    ];
    
    validateRiskAssessmentData = [
        body('patientId').isUUID().withMessage('Invalid patient ID'),
        body('age').isInt({ min: 0, max: 150 }).withMessage('Invalid age'),
        body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
        this.handleValidationErrors
    ];
    
    handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        next();
    }
    
    // Authentication endpoints
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Find user
            const user = Array.from(this.database.users.values()).find(u => u.email === email);
            if (!user) {
                this.auditLog(null, 'LOGIN_FAILED', 'Invalid email', { email });
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Verify password
            const validPassword = await bcrypt.compare(password, user.passwordHash);
            if (!validPassword) {
                this.auditLog(user.id, 'LOGIN_FAILED', 'Invalid password');
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Generate tokens
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                this.jwtSecret,
                { expiresIn: '1h' }
            );
            
            const refreshToken = jwt.sign(
                { id: user.id },
                this.jwtSecret,
                { expiresIn: '7d' }
            );
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            
            this.auditLog(user.id, 'LOGIN_SUCCESS', 'User logged in successfully');
            
            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
            
        } catch (error) {
            this.logger.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async register(req, res) {
        try {
            const { email, password, firstName, lastName } = req.body;
            
            // Check if user already exists
            const existingUser = Array.from(this.database.users.values()).find(u => u.email === email);
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);
            
            // Create user
            const user = {
                id: this.generateUUID(),
                email,
                passwordHash,
                firstName,
                lastName,
                role: 'user',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true
            };
            
            this.database.users.set(user.id, user);
            
            this.auditLog(user.id, 'USER_REGISTERED', 'New user registered');
            
            // Generate initial token
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                this.jwtSecret,
                { expiresIn: '1h' }
            );
            
            res.status(201).json({
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
            
        } catch (error) {
            this.logger.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // Screening endpoints
    async getScreenings(req, res) {
        try {
            const userScreenings = Array.from(this.database.screenings.values())
                .filter(s => s.userId === req.user.id);
            
            this.auditLog(req.user.id, 'SCREENINGS_ACCESSED', 'Retrieved screening list');
            
            res.json({
                screenings: userScreenings,
                total: userScreenings.length
            });
            
        } catch (error) {
            this.logger.error('Get screenings error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async createScreening(req, res) {
        try {
            const screeningData = {
                id: this.generateUUID(),
                userId: req.user.id,
                ...req.body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'created'
            };
            
            this.database.screenings.set(screeningData.id, screeningData);
            
            this.auditLog(req.user.id, 'SCREENING_CREATED', 'New screening created', {
                screeningId: screeningData.id,
                name: screeningData.name
            });
            
            res.status(201).json(screeningData);
            
        } catch (error) {
            this.logger.error('Create screening error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async scheduleScreening(req, res) {
        try {
            const { id } = req.params;
            const { scheduledDate, provider, notes } = req.body;
            
            const screening = this.database.screenings.get(id);
            if (!screening || screening.userId !== req.user.id) {
                return res.status(404).json({ error: 'Screening not found' });
            }
            
            screening.status = 'scheduled';
            screening.scheduledDate = scheduledDate;
            screening.provider = provider;
            screening.notes = notes;
            screening.updatedAt = new Date().toISOString();
            
            this.auditLog(req.user.id, 'SCREENING_SCHEDULED', 'Screening scheduled', {
                screeningId: id,
                scheduledDate,
                provider
            });
            
            res.json(screening);
            
        } catch (error) {
            this.logger.error('Schedule screening error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // Care Plan endpoints
    async getCarePlans(req, res) {
        try {
            const userCarePlans = Array.from(this.database.carePlans.values())
                .filter(cp => cp.userId === req.user.id);
            
            this.auditLog(req.user.id, 'CARE_PLANS_ACCESSED', 'Retrieved care plan list');
            
            res.json({
                carePlans: userCarePlans,
                total: userCarePlans.length
            });
            
        } catch (error) {
            this.logger.error('Get care plans error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async createCarePlan(req, res) {
        try {
            const carePlanData = {
                id: this.generateUUID(),
                userId: req.user.id,
                ...req.body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                progress: 0
            };
            
            // Calculate initial progress
            if (carePlanData.goals && carePlanData.goals.length > 0) {
                const completedGoals = carePlanData.goals.filter(g => g.completed).length;
                carePlanData.progress = Math.round((completedGoals / carePlanData.goals.length) * 100);
            }
            
            this.database.carePlans.set(carePlanData.id, carePlanData);
            
            this.auditLog(req.user.id, 'CARE_PLAN_CREATED', 'New care plan created', {
                carePlanId: carePlanData.id,
                name: carePlanData.name
            });
            
            res.status(201).json(carePlanData);
            
        } catch (error) {
            this.logger.error('Create care plan error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async toggleGoal(req, res) {
        try {
            const { id, goalId } = req.params;
            
            const carePlan = this.database.carePlans.get(id);
            if (!carePlan || carePlan.userId !== req.user.id) {
                return res.status(404).json({ error: 'Care plan not found' });
            }
            
            const goalIndex = parseInt(goalId);
            if (goalIndex >= carePlan.goals.length) {
                return res.status(404).json({ error: 'Goal not found' });
            }
            
            // Toggle goal completion
            carePlan.goals[goalIndex].completed = !carePlan.goals[goalIndex].completed;
            
            // Recalculate progress
            const completedGoals = carePlan.goals.filter(g => g.completed).length;
            carePlan.progress = Math.round((completedGoals / carePlan.goals.length) * 100);
            carePlan.updatedAt = new Date().toISOString();
            
            this.auditLog(req.user.id, 'GOAL_UPDATED', 'Care plan goal updated', {
                carePlanId: id,
                goalIndex,
                completed: carePlan.goals[goalIndex].completed
            });
            
            res.json(carePlan);
            
        } catch (error) {
            this.logger.error('Toggle goal error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // ML Assessment endpoints
    async calculateRiskAssessment(req, res) {
        try {
            const patientData = req.body;
            
            // In production, this would call the actual ML service
            const mlAssessment = {
                id: this.generateUUID(),
                userId: req.user.id,
                patientData,
                risks: {
                    diabetes: Math.random() * 0.6,
                    cardiovascular: Math.random() * 0.5,
                    cancer: Math.random() * 0.4,
                    bone_health: Math.random() * 0.3
                },
                recommendations: [
                    {
                        id: 'diabetes-screening',
                        title: 'Diabetes Screening',
                        priority: 8,
                        reason: 'Elevated risk factors detected'
                    }
                ],
                confidence: 0.87,
                timestamp: new Date().toISOString()
            };
            
            this.database.mlAssessments.set(mlAssessment.id, mlAssessment);
            
            this.auditLog(req.user.id, 'ML_ASSESSMENT_CALCULATED', 'Risk assessment performed');
            
            res.json(mlAssessment);
            
        } catch (error) {
            this.logger.error('Risk assessment error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // Utility functions
    auditLog(userId, action, description, metadata = {}) {
        const logEntry = {
            id: this.generateUUID(),
            userId,
            action,
            description,
            metadata,
            timestamp: new Date().toISOString(),
            ip: 'system' // In real implementation, would get from request
        };
        
        this.database.auditLogs.push(logEntry);
        
        // Log to winston as well
        this.logger.info('Audit log', logEntry);
        
        // Keep only last 10000 audit logs in memory
        if (this.database.auditLogs.length > 10000) {
            this.database.auditLogs = this.database.auditLogs.slice(-10000);
        }
    }
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    initializeData() {
        // Initialize with sample data for development
        const sampleUserId = this.generateUUID();
        
        // Create sample user
        this.database.users.set(sampleUserId, {
            id: sampleUserId,
            email: 'harsh.singhal@onecare.com',
            passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRxkZjQBjyMM5/pm', // 'password123'
            firstName: 'Demo',
            lastName: 'User',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true
        });
        
        // Create sample screening
        const screeningId = this.generateUUID();
        this.database.screenings.set(screeningId, {
            id: screeningId,
            userId: sampleUserId,
            name: 'Mammography',
            category: 'cancer',
            frequency: 12,
            status: 'overdue',
            lastDone: '2022-01-15',
            riskLevel: 'high',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // Create sample care plan
        const carePlanId = this.generateUUID();
        this.database.carePlans.set(carePlanId, {
            id: carePlanId,
            userId: sampleUserId,
            name: 'Diabetes Management',
            condition: 'diabetes',
            goals: [
                { text: 'Daily blood glucose monitoring', completed: true },
                { text: 'HbA1c < 7%', completed: true },
                { text: '30 minutes exercise daily', completed: false },
                { text: 'Lose 10 lbs', completed: false }
            ],
            progress: 50,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        this.logger.info('Sample data initialized');
    }
    
    start() {
        this.app.listen(this.port, () => {
            this.logger.info(`OneCare Screening API server running on port ${this.port}`);
        });
    }
}

// Export for use
if (require.main === module) {
    const api = new OneCareScreeningAPI();
    api.start();
}

module.exports = OneCareScreeningAPI;
