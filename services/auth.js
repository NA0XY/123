const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const DatabaseManager = require('../database/database');

class AuthService {
    constructor() {
        this.db = new DatabaseManager();
        this.jwtSecret = process.env.JWT_SECRET || 'onecare-healthcare-secret-2024';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.saltRounds = 12;
    }

    // Initialize the auth service
    async initialize() {
        await this.db.initialize();
    }

    // Hash password
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            console.error('Error hashing password:', error);
            throw new Error('Password hashing failed');
        }
    }

    // Verify password
    async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }

    // Generate JWT token
    generateToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
            issuer: 'onecare-healthcare',
            audience: 'onecare-users'
        });
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'onecare-healthcare',
                audience: 'onecare-users'
            });
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }

    // Hash token for database storage
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    // Register new user
    async register(userData) {
        try {
            // Check if username or email already exists
            const existingUser = await this.db.getUserByUsername(userData.username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            // Hash password
            const password_hash = await this.hashPassword(userData.password);

            // Create user data
            const newUser = {
                username: userData.username,
                email: userData.email,
                password_hash: password_hash,
                role: userData.role || 'staff',
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone: userData.phone
            };

            // Create user in database
            const result = await this.db.createUser(newUser);
            
            // Log the registration
            await this.db.logAction(
                result.id,
                'USER_REGISTERED',
                'users',
                result.id,
                null,
                { username: userData.username, role: userData.role },
                userData.ip_address,
                userData.user_agent
            );

            return {
                success: true,
                message: 'User registered successfully',
                userId: result.id
            };
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    // Login user
    async login(username, password, ipAddress = null, userAgent = null) {
        try {
            // Get user by username
            const user = await this.db.getUserByUsername(username);
            if (!user) {
                throw new Error('Invalid username or password');
            }

            // Verify password
            const isPasswordValid = await this.verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                // Log failed login attempt
                await this.db.logAction(
                    user.id,
                    'LOGIN_FAILED',
                    'users',
                    user.id,
                    null,
                    { reason: 'invalid_password' },
                    ipAddress,
                    userAgent
                );
                throw new Error('Invalid username or password');
            }

            // Generate JWT token
            const token = this.generateToken(user);
            const tokenHash = this.hashToken(token);

            // Calculate token expiration (24 hours from now)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            const expiresAtISO = expiresAt.toISOString();

            // Create session in database
            await this.db.createSession(user.id, tokenHash, expiresAtISO, ipAddress, userAgent);

            // Update user last login
            await this.db.updateUserLastLogin(user.id);

            // Log successful login
            await this.db.logAction(
                user.id,
                'LOGIN_SUCCESS',
                'users',
                user.id,
                null,
                { login_time: new Date().toISOString() },
                ipAddress,
                userAgent
            );

            // Return user data and token (excluding password hash)
            const { password_hash, ...userWithoutPassword } = user;
            
            return {
                success: true,
                message: 'Login successful',
                user: userWithoutPassword,
                token: token,
                expiresAt: expiresAt
            };
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    // Logout user
    async logout(token, ipAddress = null, userAgent = null) {
        try {
            const tokenHash = this.hashToken(token);
            
            // Get session info
            const session = await this.db.getSessionByToken(tokenHash);
            if (session) {
                // Deactivate session
                await this.db.deactivateSession(tokenHash);

                // Log logout
                await this.db.logAction(
                    session.user_id,
                    'LOGOUT',
                    'user_sessions',
                    session.id,
                    null,
                    { logout_time: new Date().toISOString() },
                    ipAddress,
                    userAgent
                );
            }

            return {
                success: true,
                message: 'Logout successful'
            };
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }

    // Verify user session
    async verifySession(token) {
        try {
            // Verify JWT token
            const decoded = this.verifyToken(token);
            if (!decoded) {
                console.log('JWT token verification failed');
                throw new Error('Invalid token');
            }

            // Hash token and check in database
            const tokenHash = this.hashToken(token);
            console.log('Looking for session with token hash:', tokenHash.substring(0, 10) + '...');
            const session = await this.db.getSessionByToken(tokenHash);
            
            if (!session) {
                console.log('No active session found for token');
                throw new Error('Session not found or expired');
            }

            console.log('Session found for user:', session.username);
            return {
                success: true,
                user: {
                    id: session.user_id,
                    username: session.username,
                    role: session.role,
                    first_name: session.first_name,
                    last_name: session.last_name
                },
                session: session
            };
        } catch (error) {
            console.error('Session verification failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Middleware to authenticate requests
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        this.verifySession(token).then(result => {
            if (result.success) {
                req.user = result.user;
                req.session = result.session;
                next();
            } else {
                res.status(403).json({ 
                    success: false, 
                    error: 'Invalid or expired token' 
                });
            }
        }).catch(error => {
            console.error('Authentication error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Authentication failed' 
            });
        });
    }

    // Middleware to check user role
    requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Authentication required' 
                });
            }

            const userRole = req.user.role;
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Insufficient permissions' 
                });
            }

            next();
        };
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Get user
            const user = await this.db.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const newPasswordHash = await this.hashPassword(newPassword);

            // Update password in database
            const sql = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            await this.db.run(sql, [newPasswordHash, userId]);

            // Deactivate all user sessions (force re-login)
            await this.db.deactivateAllUserSessions(userId);

            // Log password change
            await this.db.logAction(
                userId,
                'PASSWORD_CHANGED',
                'users',
                userId,
                null,
                { changed_at: new Date().toISOString() }
            );

            return {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (error) {
            console.error('Password change failed:', error);
            throw error;
        }
    }

    // Close database connection
    async close() {
        await this.db.close();
    }
}

module.exports = AuthService;