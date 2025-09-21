/**
 * Health Records API
 * RESTful API for comprehensive health records management
 * Features: CRUD operations, file uploads, sharing, security, and analytics
 */

const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');

class HealthRecordsAPI {
    constructor() {
        this.app = express();
        this.port = process.env.HEALTH_RECORDS_PORT || 3004;
        this.jwtSecret = process.env.JWT_SECRET || 'health-records-super-secret-key-2024';
        this.uploadPath = process.env.UPLOAD_PATH || './uploads/health-records';
        
        // In-memory database (replace with actual database in production)
        this.database = {
            users: new Map(),
            records: new Map(),
            shares: new Map(),
            categories: new Map(),
            auditLogs: [],
            sessions: new Map()
        };

        this.initializeDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.createUploadDirectories();
    }

    async initializeDatabase() {
        // Initialize categories
        const categories = [
            { id: 'lab-results', name: 'Lab Results', icon: '🧪', color: '#3b82f6' },
            { id: 'imaging', name: 'Imaging', icon: '📷', color: '#6366f1' },
            { id: 'prescriptions', name: 'Prescriptions', icon: '💊', color: '#8b5cf6' },
            { id: 'discharge-summary', name: 'Discharge Summary', icon: '🏥', color: '#a855f7' },
            { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#d946ef' },
            { id: 'vaccination', name: 'Vaccination Records', icon: '💉', color: '#ec4899' },
            { id: 'specialist-reports', name: 'Specialist Reports', icon: '👨‍⚕️', color: '#f43f5e' },
            { id: 'other', name: 'Other', icon: '📄', color: '#64748b' }
        ];

        categories.forEach(category => {
            this.database.categories.set(category.id, category);
        });

        // Create sample user for demo
        const sampleUser = {
            id: 'user_demo',
            email: 'harsh.singhal@onecare.com',
            firstName: 'Harsh',
            lastName: 'Singhal',
            passwordHash: await bcrypt.hash('demo123', 10),
            role: 'patient',
            createdAt: new Date().toISOString(),
            preferences: {
                notifications: true,
                autoShare: false,
                defaultCategory: 'other'
            }
        };

        this.database.users.set(sampleUser.id, sampleUser);
        console.log('🏥 Health Records API initialized with sample data');
    }

    setupMiddleware() {
        // Security
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 200, // limit each IP to 200 requests per windowMs
            message: { error: 'Too many requests, please try again later.' }
        });
        this.app.use('/api/health-records/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            
            // Add request ID for tracking
            req.requestId = uuidv4();
            
            next();
        });

        // File upload configuration
        this.setupFileUpload();
    }

    setupFileUpload() {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const userDir = path.join(this.uploadPath, req.user?.id || 'temp');
                try {
                    await fs.mkdir(userDir, { recursive: true });
                    cb(null, userDir);
                } catch (error) {
                    cb(error, null);
                }
            },
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const randomString = crypto.randomBytes(8).toString('hex');
                const extension = path.extname(file.originalname);
                const filename = `${timestamp}_${randomString}${extension}`;
                cb(null, filename);
            }
        });

        const fileFilter = (req, file, cb) => {
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/jpg',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${file.mimetype} not allowed`), false);
            }
        };

        this.upload = multer({
            storage,
            fileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
                files: 5 // Max 5 files per upload
            }
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health-records/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'health-records-api',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });

        // Authentication routes
        this.app.post('/api/health-records/auth/login', this.login.bind(this));
        this.app.post('/api/health-records/auth/refresh', this.authenticateToken.bind(this), this.refreshToken.bind(this));
        this.app.post('/api/health-records/auth/logout', this.authenticateToken.bind(this), this.logout.bind(this));

        // Categories routes
        this.app.get('/api/health-records/categories', this.authenticateToken.bind(this), this.getCategories.bind(this));

        // Records routes
        this.app.get('/api/health-records/records', this.authenticateToken.bind(this), this.getRecords.bind(this));
        this.app.get('/api/health-records/records/:id', this.authenticateToken.bind(this), this.getRecord.bind(this));
        this.app.post('/api/health-records/records', this.authenticateToken.bind(this), this.upload.array('files', 5), this.createRecord.bind(this));
        this.app.put('/api/health-records/records/:id', this.authenticateToken.bind(this), this.updateRecord.bind(this));
        this.app.delete('/api/health-records/records/:id', this.authenticateToken.bind(this), this.deleteRecord.bind(this));

        // File management routes
        this.app.get('/api/health-records/files/:recordId/:filename', this.authenticateToken.bind(this), this.downloadFile.bind(this));
        this.app.post('/api/health-records/files/upload', this.authenticateToken.bind(this), this.upload.array('files', 5), this.uploadFiles.bind(this));

        // Sharing routes
        this.app.post('/api/health-records/records/:id/share', this.authenticateToken.bind(this), this.shareRecord.bind(this));
        this.app.get('/api/health-records/shares', this.authenticateToken.bind(this), this.getShares.bind(this));
        this.app.delete('/api/health-records/shares/:id', this.authenticateToken.bind(this), this.revokeShare.bind(this));

        // Search and analytics routes
        this.app.get('/api/health-records/search', this.authenticateToken.bind(this), this.searchRecords.bind(this));
        this.app.get('/api/health-records/analytics/dashboard', this.authenticateToken.bind(this), this.getDashboardAnalytics.bind(this));
        this.app.get('/api/health-records/analytics/timeline', this.authenticateToken.bind(this), this.getTimelineData.bind(this));

        // Export routes
        this.app.get('/api/health-records/export/records', this.authenticateToken.bind(this), this.exportRecords.bind(this));

        // Error handling
        this.app.use(this.errorHandler.bind(this));
    }

    // Authentication middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        jwt.verify(token, this.jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    error: 'Invalid or expired token',
                    code: 'AUTH_TOKEN_INVALID'
                });
            }

            // Check if session exists
            const session = this.database.sessions.get(user.sessionId);
            if (!session || session.expired) {
                return res.status(403).json({
                    error: 'Session expired',
                    code: 'SESSION_EXPIRED'
                });
            }

            req.user = user;
            next();
        });
    }

    // Authentication handlers
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Find user by email
            const user = Array.from(this.database.users.values()).find(u => u.email === email);
            
            if (!user) {
                await this.auditLog(null, 'LOGIN_FAILED', { email, reason: 'user_not_found' });
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.passwordHash);
            if (!validPassword) {
                await this.auditLog(user.id, 'LOGIN_FAILED', { reason: 'invalid_password' });
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Create session
            const sessionId = uuidv4();
            const session = {
                id: sessionId,
                userId: user.id,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                expired: false
            };

            this.database.sessions.set(sessionId, session);

            // Create JWT token
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role,
                sessionId: sessionId
            };

            const accessToken = jwt.sign(tokenPayload, this.jwtSecret, { expiresIn: '24h' });
            const refreshToken = jwt.sign({ sessionId }, this.jwtSecret, { expiresIn: '7d' });

            await this.auditLog(user.id, 'LOGIN_SUCCESS', { sessionId });

            res.json({
                success: true,
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    preferences: user.preferences
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    error: 'Refresh token required',
                    code: 'REFRESH_TOKEN_MISSING'
                });
            }

            const decoded = jwt.verify(refreshToken, this.jwtSecret);
            const session = this.database.sessions.get(decoded.sessionId);

            if (!session || session.expired) {
                return res.status(403).json({
                    error: 'Invalid refresh token',
                    code: 'REFRESH_TOKEN_INVALID'
                });
            }

            const user = this.database.users.get(session.userId);
            if (!user) {
                return res.status(403).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Update session activity
            session.lastActivity = new Date().toISOString();

            // Create new access token
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role,
                sessionId: session.id
            };

            const accessToken = jwt.sign(tokenPayload, this.jwtSecret, { expiresIn: '24h' });

            res.json({
                success: true,
                accessToken
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(403).json({
                error: 'Invalid refresh token',
                code: 'REFRESH_TOKEN_INVALID'
            });
        }
    }

    async logout(req, res) {
        try {
            const session = this.database.sessions.get(req.user.sessionId);
            if (session) {
                session.expired = true;
            }

            await this.auditLog(req.user.id, 'LOGOUT', { sessionId: req.user.sessionId });

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Categories handlers
    async getCategories(req, res) {
        try {
            const categories = Array.from(this.database.categories.values());
            
            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Records handlers
    async getRecords(req, res) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                category, 
                status, 
                search, 
                startDate, 
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const userId = req.user.id;
            let records = Array.from(this.database.records.values())
                .filter(record => record.userId === userId);

            // Apply filters
            if (category) {
                records = records.filter(record => record.category === category);
            }

            if (status) {
                records = records.filter(record => record.status === status);
            }

            if (search) {
                const searchLower = search.toLowerCase();
                records = records.filter(record =>
                    record.title.toLowerCase().includes(searchLower) ||
                    record.description.toLowerCase().includes(searchLower) ||
                    record.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
                    record.provider.toLowerCase().includes(searchLower)
                );
            }

            if (startDate) {
                records = records.filter(record => new Date(record.date) >= new Date(startDate));
            }

            if (endDate) {
                records = records.filter(record => new Date(record.date) <= new Date(endDate));
            }

            // Sort records
            records.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                if (sortBy === 'date' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (sortOrder === 'desc') {
                    return bValue > aValue ? 1 : -1;
                } else {
                    return aValue > bValue ? 1 : -1;
                }
            });

            // Pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const paginatedRecords = records.slice(offset, offset + limitNum);

            // Get category information for each record
            const recordsWithCategories = paginatedRecords.map(record => ({
                ...record,
                categoryInfo: this.database.categories.get(record.category),
                // Include FHIR resource if available, otherwise convert
                fhirResource: record.fhirResource || this.convertToFHIRObservation(record)
            }));

            res.json({
                success: true,
                data: recordsWithCategories,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: records.length,
                    pages: Math.ceil(records.length / limitNum)
                }
            });

        } catch (error) {
            console.error('Get records error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async getRecord(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const record = this.database.records.get(id);

            if (!record) {
                return res.status(404).json({
                    error: 'Record not found',
                    code: 'RECORD_NOT_FOUND'
                });
            }

            if (record.userId !== userId) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            const recordWithCategory = {
                ...record,
                categoryInfo: this.database.categories.get(record.category),
                // Include FHIR resource if available, otherwise convert
                fhirResource: record.fhirResource || this.convertToFHIRObservation(record)
            };

            res.json({
                success: true,
                data: recordWithCategory
            });

        } catch (error) {
            console.error('Get record error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async createRecord(req, res) {
        try {
            const {
                title,
                category,
                description = '',
                date,
                provider = '',
                important = false,
                tags = []
            } = req.body;

            const userId = req.user.id;

            // Validation
            if (!title || !category) {
                return res.status(400).json({
                    error: 'Title and category are required',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            if (!this.database.categories.has(category)) {
                return res.status(400).json({
                    error: 'Invalid category',
                    code: 'INVALID_CATEGORY'
                });
            }

            // Process uploaded files
            const files = req.files || [];
            const fileData = files.map(file => ({
                id: uuidv4(),
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date().toISOString()
            }));

            // Create FHIR-compliant Observation resource
            const observationId = uuidv4();
            const observation = {
                resourceType: 'Observation',
                id: observationId,
                meta: {
                    versionId: '1',
                    lastUpdated: new Date().toISOString(),
                    profile: ['http://hl7.org/fhir/StructureDefinition/Observation']
                },
                status: 'final',
                category: [{
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                        code: this.getFHIRCategoryCode(category),
                        display: this.database.categories.get(category)?.name || category
                    }]
                }],
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: this.getLOINCCode(category),
                        display: title
                    }],
                    text: title
                },
                subject: {
                    reference: `Patient/${userId}`,
                    display: req.user.email
                },
                effectiveDateTime: date ? new Date(date).toISOString() : new Date().toISOString(),
                issued: new Date().toISOString(),
                performer: [{
                    reference: provider ? `Practitioner/${provider}` : `Patient/${userId}`,
                    display: provider || req.user.email
                }],
                valueString: description || 'Health record document',
                note: description ? [{
                    text: description
                }] : undefined,
                component: files.length > 0 ? files.map((file, index) => ({
                    code: {
                        coding: [{
                            system: 'http://loinc.org',
                            code: '55107-7',
                            display: 'Document'
                        }]
                    },
                    valueAttachment: {
                        contentType: file.mimetype,
                        url: `/api/health-records/files/${observationId}/${file.filename}`,
                        title: file.originalname,
                        size: file.size
                    }
                })) : undefined
            };

            // Create legacy record structure for backward compatibility
            const record = {
                id: observationId,
                userId,
                title,
                category,
                description,
                date: date || new Date().toISOString().split('T')[0],
                provider,
                status: 'final',
                important: important === 'true' || important === true,
                shared: false,
                tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
                files: fileData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                // Add FHIR resource
                fhirResource: observation
            };

            this.database.records.set(record.id, record);

            await this.auditLog(userId, 'RECORD_CREATED', {
                recordId: record.id,
                title: record.title,
                category: record.category,
                fileCount: files.length
            });

            res.status(201).json({
                success: true,
                data: record,
                fhirResource: observation,
                message: 'Record created successfully'
            });

        } catch (error) {
            console.error('Create record error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async updateRecord(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const record = this.database.records.get(id);

            if (!record) {
                return res.status(404).json({
                    error: 'Record not found',
                    code: 'RECORD_NOT_FOUND'
                });
            }

            if (record.userId !== userId) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            const {
                title,
                category,
                description,
                date,
                provider,
                important,
                status,
                tags
            } = req.body;

            // Update fields
            if (title !== undefined) record.title = title;
            if (category !== undefined) {
                if (!this.database.categories.has(category)) {
                    return res.status(400).json({
                        error: 'Invalid category',
                        code: 'INVALID_CATEGORY'
                    });
                }
                record.category = category;
            }
            if (description !== undefined) record.description = description;
            if (date !== undefined) record.date = date;
            if (provider !== undefined) record.provider = provider;
            if (important !== undefined) record.important = important;
            if (status !== undefined) record.status = status;
            if (tags !== undefined) {
                record.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
            }

            record.updatedAt = new Date().toISOString();

            this.database.records.set(record.id, record);

            await this.auditLog(userId, 'RECORD_UPDATED', {
                recordId: record.id,
                title: record.title
            });

            res.json({
                success: true,
                data: record,
                message: 'Record updated successfully'
            });

        } catch (error) {
            console.error('Update record error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async deleteRecord(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const record = this.database.records.get(id);

            if (!record) {
                return res.status(404).json({
                    error: 'Record not found',
                    code: 'RECORD_NOT_FOUND'
                });
            }

            if (record.userId !== userId) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            // Delete associated files
            for (const file of record.files) {
                try {
                    await fs.unlink(file.path);
                } catch (error) {
                    console.warn(`Failed to delete file: ${file.path}`);
                }
            }

            // Remove record
            this.database.records.delete(id);

            // Remove associated shares
            const sharesToDelete = Array.from(this.database.shares.values())
                .filter(share => share.recordId === id);
            
            sharesToDelete.forEach(share => {
                this.database.shares.delete(share.id);
            });

            await this.auditLog(userId, 'RECORD_DELETED', {
                recordId: id,
                title: record.title
            });

            res.json({
                success: true,
                message: 'Record deleted successfully'
            });

        } catch (error) {
            console.error('Delete record error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // File management handlers
    async downloadFile(req, res) {
        try {
            const { recordId, filename } = req.params;
            const userId = req.user.id;

            const record = this.database.records.get(recordId);

            if (!record) {
                return res.status(404).json({
                    error: 'Record not found',
                    code: 'RECORD_NOT_FOUND'
                });
            }

            if (record.userId !== userId) {
                // Check if record is shared with user
                const sharedWithUser = Array.from(this.database.shares.values())
                    .some(share => 
                        share.recordId === recordId && 
                        share.sharedWith === req.user.email &&
                        (!share.expiresAt || new Date(share.expiresAt) > new Date())
                    );

                if (!sharedWithUser) {
                    return res.status(403).json({
                        error: 'Access denied',
                        code: 'ACCESS_DENIED'
                    });
                }
            }

            const file = record.files.find(f => f.filename === filename);

            if (!file) {
                return res.status(404).json({
                    error: 'File not found',
                    code: 'FILE_NOT_FOUND'
                });
            }

            await this.auditLog(userId, 'FILE_DOWNLOADED', {
                recordId,
                filename,
                fileId: file.id
            });

            res.download(file.path, file.originalName);

        } catch (error) {
            console.error('Download file error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async uploadFiles(req, res) {
        try {
            const files = req.files || [];
            
            if (files.length === 0) {
                return res.status(400).json({
                    error: 'No files uploaded',
                    code: 'NO_FILES'
                });
            }

            const fileData = files.map(file => ({
                id: uuidv4(),
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date().toISOString()
            }));

            res.json({
                success: true,
                data: fileData,
                message: 'Files uploaded successfully'
            });

        } catch (error) {
            console.error('Upload files error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Sharing handlers
    async shareRecord(req, res) {
        try {
            const { id } = req.params;
            const { emails, message, expiresIn, permissions } = req.body;
            const userId = req.user.id;

            const record = this.database.records.get(id);

            if (!record) {
                return res.status(404).json({
                    error: 'Record not found',
                    code: 'RECORD_NOT_FOUND'
                });
            }

            if (record.userId !== userId) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({
                    error: 'Email addresses required',
                    code: 'EMAILS_REQUIRED'
                });
            }

            const expiresAt = expiresIn && expiresIn !== 'never' 
                ? this.calculateExpiryDate(expiresIn)
                : null;

            const shares = emails.map(email => ({
                id: uuidv4(),
                recordId: id,
                sharedBy: userId,
                sharedWith: email.trim(),
                message: message || '',
                permissions: permissions || { view: true, download: false, comment: false },
                expiresAt,
                createdAt: new Date().toISOString()
            }));

            shares.forEach(share => {
                this.database.shares.set(share.id, share);
            });

            // Update record shared status
            record.shared = true;
            record.updatedAt = new Date().toISOString();
            this.database.records.set(record.id, record);

            await this.auditLog(userId, 'RECORD_SHARED', {
                recordId: id,
                title: record.title,
                sharedWith: emails,
                shareCount: shares.length
            });

            res.json({
                success: true,
                data: shares,
                message: `Record shared with ${emails.length} recipient(s)`
            });

        } catch (error) {
            console.error('Share record error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async getShares(req, res) {
        try {
            const userId = req.user.id;

            const outgoingShares = Array.from(this.database.shares.values())
                .filter(share => share.sharedBy === userId)
                .map(share => {
                    const record = this.database.records.get(share.recordId);
                    return {
                        ...share,
                        record: record ? {
                            id: record.id,
                            title: record.title,
                            category: record.category
                        } : null
                    };
                });

            const incomingShares = Array.from(this.database.shares.values())
                .filter(share => share.sharedWith === req.user.email)
                .map(share => {
                    const record = this.database.records.get(share.recordId);
                    const sharedBy = this.database.users.get(share.sharedBy);
                    return {
                        ...share,
                        record: record ? {
                            id: record.id,
                            title: record.title,
                            category: record.category
                        } : null,
                        sharedByUser: sharedBy ? {
                            id: sharedBy.id,
                            firstName: sharedBy.firstName,
                            lastName: sharedBy.lastName,
                            email: sharedBy.email
                        } : null
                    };
                });

            res.json({
                success: true,
                data: {
                    outgoing: outgoingShares,
                    incoming: incomingShares
                }
            });

        } catch (error) {
            console.error('Get shares error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async revokeShare(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const share = this.database.shares.get(id);

            if (!share) {
                return res.status(404).json({
                    error: 'Share not found',
                    code: 'SHARE_NOT_FOUND'
                });
            }

            if (share.sharedBy !== userId) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            this.database.shares.delete(id);

            await this.auditLog(userId, 'SHARE_REVOKED', {
                shareId: id,
                recordId: share.recordId,
                sharedWith: share.sharedWith
            });

            res.json({
                success: true,
                message: 'Share revoked successfully'
            });

        } catch (error) {
            console.error('Revoke share error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Search and analytics handlers
    async searchRecords(req, res) {
        try {
            const { query, filters = {} } = req.query;
            const userId = req.user.id;

            if (!query) {
                return res.status(400).json({
                    error: 'Search query required',
                    code: 'QUERY_REQUIRED'
                });
            }

            let records = Array.from(this.database.records.values())
                .filter(record => record.userId === userId);

            // Apply search
            const searchLower = query.toLowerCase();
            records = records.filter(record =>
                record.title.toLowerCase().includes(searchLower) ||
                record.description.toLowerCase().includes(searchLower) ||
                record.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
                record.provider.toLowerCase().includes(searchLower)
            );

            // Apply filters
            if (filters.category) {
                records = records.filter(record => record.category === filters.category);
            }

            if (filters.status) {
                records = records.filter(record => record.status === filters.status);
            }

            if (filters.important !== undefined) {
                records = records.filter(record => record.important === (filters.important === 'true'));
            }

            // Sort by relevance (simple implementation)
            records.sort((a, b) => {
                const aScore = this.calculateRelevanceScore(a, query);
                const bScore = this.calculateRelevanceScore(b, query);
                return bScore - aScore;
            });

            const recordsWithCategories = records.map(record => ({
                ...record,
                categoryInfo: this.database.categories.get(record.category)
            }));

            res.json({
                success: true,
                data: recordsWithCategories,
                query,
                total: records.length
            });

        } catch (error) {
            console.error('Search records error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async getDashboardAnalytics(req, res) {
        try {
            const userId = req.user.id;
            const records = Array.from(this.database.records.values())
                .filter(record => record.userId === userId);

            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisYear = new Date(now.getFullYear(), 0, 1);

            // Basic statistics
            const stats = {
                total: records.length,
                thisMonth: records.filter(r => new Date(r.createdAt) >= thisMonth).length,
                thisYear: records.filter(r => new Date(r.createdAt) >= thisYear).length,
                important: records.filter(r => r.important).length,
                shared: records.filter(r => r.shared).length,
                byStatus: {},
                byCategory: {}
            };

            // Group by status
            records.forEach(record => {
                stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1;
            });

            // Group by category
            records.forEach(record => {
                const categoryInfo = this.database.categories.get(record.category);
                stats.byCategory[record.category] = {
                    count: (stats.byCategory[record.category]?.count || 0) + 1,
                    name: categoryInfo?.name || record.category,
                    color: categoryInfo?.color || '#64748b'
                };
            });

            // Recent activity (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentRecords = records
                .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);

            res.json({
                success: true,
                data: {
                    statistics: stats,
                    recentActivity: recentRecords
                }
            });

        } catch (error) {
            console.error('Get dashboard analytics error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    async getTimelineData(req, res) {
        try {
            const userId = req.user.id;
            const { period = '6months' } = req.query;

            let startDate = new Date();
            switch (period) {
                case '1month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case '3months':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
                case '6months':
                    startDate.setMonth(startDate.getMonth() - 6);
                    break;
                case '1year':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setMonth(startDate.getMonth() - 6);
            }

            const records = Array.from(this.database.records.values())
                .filter(record => 
                    record.userId === userId && 
                    new Date(record.date) >= startDate
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const timelineData = records.map(record => ({
                id: record.id,
                title: record.title,
                date: record.date,
                category: record.category,
                categoryInfo: this.database.categories.get(record.category),
                status: record.status,
                important: record.important,
                provider: record.provider
            }));

            res.json({
                success: true,
                data: timelineData,
                period
            });

        } catch (error) {
            console.error('Get timeline data error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Export handlers
    async exportRecords(req, res) {
        try {
            const userId = req.user.id;
            const { format = 'json' } = req.query;

            const records = Array.from(this.database.records.values())
                .filter(record => record.userId === userId);

            const recordsWithCategories = records.map(record => ({
                ...record,
                categoryInfo: this.database.categories.get(record.category)
            }));

            const exportData = {
                exportedAt: new Date().toISOString(),
                totalRecords: records.length,
                records: recordsWithCategories
            };

            if (format === 'csv') {
                // Simple CSV export (you might want to use a proper CSV library)
                const csvRows = [];
                csvRows.push('ID,Title,Category,Date,Provider,Status,Important,Description');
                
                recordsWithCategories.forEach(record => {
                    csvRows.push([
                        record.id,
                        `"${record.title}"`,
                        record.category,
                        record.date,
                        `"${record.provider}"`,
                        record.status,
                        record.important,
                        `"${record.description.replace(/"/g, '""')}"`
                    ].join(','));
                });

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="health-records-export.csv"');
                return res.send(csvRows.join('\n'));
            }

            await this.auditLog(userId, 'RECORDS_EXPORTED', {
                format,
                recordCount: records.length
            });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="health-records-export.json"');
            res.json(exportData);

        } catch (error) {
            console.error('Export records error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    }

    // Helper methods
    calculateRelevanceScore(record, query) {
        const queryLower = query.toLowerCase();
        let score = 0;

        // Title match (highest weight)
        if (record.title.toLowerCase().includes(queryLower)) {
            score += 10;
        }

        // Tag match (high weight)
        if (record.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
            score += 8;
        }

        // Description match (medium weight)
        if (record.description.toLowerCase().includes(queryLower)) {
            score += 5;
        }

        // Provider match (low weight)
        if (record.provider.toLowerCase().includes(queryLower)) {
            score += 3;
        }

        // Boost for important records
        if (record.important) {
            score += 2;
        }

        // Recent records get slight boost
        const daysSinceCreated = (new Date() - new Date(record.createdAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 30) {
            score += 1;
        }

        return score;
    }

    calculateExpiryDate(expiresIn) {
        const now = new Date();
        switch (expiresIn) {
            case '24h':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            case '90d':
                return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    }

    async createUploadDirectories() {
        try {
            await fs.mkdir(this.uploadPath, { recursive: true });
            console.log(`📁 Upload directory created: ${this.uploadPath}`);
        } catch (error) {
            console.error('Failed to create upload directories:', error);
        }
    }

    async auditLog(userId, action, data = {}) {
        const logEntry = {
            id: uuidv4(),
            userId,
            action,
            data,
            timestamp: new Date().toISOString(),
            ip: this.currentRequest?.ip || 'unknown'
        };

        this.database.auditLogs.push(logEntry);

        // Keep only last 1000 log entries (in production, you'd use proper log management)
        if (this.database.auditLogs.length > 1000) {
            this.database.auditLogs = this.database.auditLogs.slice(-1000);
        }
    }

    errorHandler(error, req, res, next) {
        console.error('API Error:', error);

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'File too large',
                    code: 'FILE_TOO_LARGE'
                });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    error: 'Too many files',
                    code: 'TOO_MANY_FILES'
                });
            }
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    error: 'Unexpected file field',
                    code: 'UNEXPECTED_FILE'
                });
            }
        }

        if (error.message && error.message.includes('File type') && error.message.includes('not allowed')) {
            return res.status(400).json({
                error: error.message,
                code: 'INVALID_FILE_TYPE'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            code: 'SERVER_ERROR'
        });
    }

    // FHIR Helper Methods
    getFHIRCategoryCode(category) {
        const categoryMap = {
            'lab-results': 'laboratory',
            'imaging': 'imaging',
            'prescriptions': 'medication',
            'discharge-summary': 'procedure',
            'insurance': 'social-history',
            'vaccination': 'procedure',
            'specialist-reports': 'procedure',
            'other': 'social-history'
        };
        return categoryMap[category] || 'social-history';
    }

    getLOINCCode(category) {
        const loincMap = {
            'lab-results': '11502-2',
            'imaging': '18748-4',
            'prescriptions': '10160-0',
            'discharge-summary': '18842-5',
            'insurance': '57828-6',
            'vaccination': '11369-6',
            'specialist-reports': '34117-2',
            'other': '34117-2'
        };
        return loincMap[category] || '34117-2'; // Default to General purpose document
    }

    // Convert existing record to FHIR Observation
    convertToFHIRObservation(record) {
        return {
            resourceType: 'Observation',
            id: record.id,
            meta: {
                versionId: '1',
                lastUpdated: record.updatedAt,
                profile: ['http://hl7.org/fhir/StructureDefinition/Observation']
            },
            status: record.status === 'final' ? 'final' : 'preliminary',
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: this.getFHIRCategoryCode(record.category),
                    display: this.database.categories.get(record.category)?.name || record.category
                }]
            }],
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: this.getLOINCCode(record.category),
                    display: record.title
                }],
                text: record.title
            },
            subject: {
                reference: `Patient/${record.userId}`
            },
            effectiveDateTime: new Date(record.date).toISOString(),
            issued: record.createdAt,
            valueString: record.description || 'Health record document',
            note: record.description ? [{
                text: record.description
            }] : undefined,
            component: record.files && record.files.length > 0 ? record.files.map(file => ({
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '55107-7',
                        display: 'Document'
                    }]
                },
                valueAttachment: {
                    contentType: file.mimetype,
                    url: `/api/health-records/files/${record.id}/${file.filename}`,
                    title: file.originalName || file.filename,
                    size: file.size
                }
            })) : undefined
        };
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🏥 Health Records API running on port ${this.port}`);
            console.log(`📝 Available at: http://localhost:${this.port}/api/health-records/`);
            console.log(`🏥 FHIR Resources: http://localhost:3003/fhir/`);
        });
    }
}

// Create and start the API server
const healthRecordsAPI = new HealthRecordsAPI();
healthRecordsAPI.start();

module.exports = HealthRecordsAPI;