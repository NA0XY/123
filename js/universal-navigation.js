/**
 * Universal Navigation and Modal System for OneCare Healthcare Platform
 * Handles all common navigation functions, modals, and UI interactions across pages
 */

class OneCareNavigation {
    constructor() {
        this.modalsInitialized = false;
        this.notificationPanel = null;
        this.helpModal = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeModals();
        this.loadUserData();
    }

    setupEventListeners() {
        // Handle clicks outside dropdowns and panels
        document.addEventListener('click', (event) => {
            this.handleOutsideClicks(event);
        });

        // Handle escape key for closing modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Profile Functions
     */
    openProfileSettings() {
        if (typeof showProfileModal === 'function') {
            showProfileModal();
        } else {
            console.log('Profile modal loading...');
            // Fallback - create inline profile modal
            this.createInlineProfileModal();
        }
    }

    openAccountSettings() {
        if (typeof showSettingsModal === 'function') {
            showSettingsModal();
        } else {
            console.log('Settings modal loading...');
            // Fallback - create inline settings modal  
            this.createInlineSettingsModal();
        }
    }

    /**
     * Navigation Functions
     */
    showNotifications() {
        this.createNotificationPanel();
        document.getElementById('notificationPanel').style.display = 'block';
    }

    showHelpModal() {
        this.createHelpModal();
        document.getElementById('helpModal').style.display = 'flex';
    }

    /**
     * Upload and Record Functions
     */
    showUploadModal() {
        this.createUploadModal();
        document.getElementById('uploadModal').style.display = 'flex';
    }

    createNewRecord() {
        this.createRecordModal();
        document.getElementById('recordModal').style.display = 'flex';
    }

    /**
     * Search Functions
     */
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    }

    /**
     * User Menu Functions
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown') || document.getElementById('profileMenu');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    logout() {
        const confirmLogout = confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            // Clear stored data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('userProfile');
            
            // Redirect to home page
            window.location.href = 'index.html';
        }
    }

    /**
     * Modal Creation Functions
     */
    createNotificationPanel() {
        if (document.getElementById('notificationPanel')) return;

        const notificationHTML = `
            <div id="notificationPanel" style="display: none; position: fixed; top: 80px; right: 20px; width: 400px; max-width: 90vw; max-height: 500px; background: white; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; overflow-y: auto;">
                <div style="padding: 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1e293b; font-size: 1.1rem;">Notifications</h3>
                    <button onclick="oneCareNav.closeNotificationPanel()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;">&times;</button>
                </div>
                <div style="padding: 1rem;">
                    <div class="notification-item" style="padding: 1rem; margin-bottom: 0.75rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 0.9rem; font-weight: 600;">Appointment Reminder</h4>
                        <p style="margin: 0; color: #64748b; font-size: 0.8rem; line-height: 1.4;">You have an appointment with Dr. Smith tomorrow at 2:00 PM</p>
                        <small style="color: #94a3b8; font-size: 0.75rem;">2 hours ago</small>
                    </div>
                    <div class="notification-item" style="padding: 1rem; margin-bottom: 0.75rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 0.9rem; font-weight: 600;">Lab Results Available</h4>
                        <p style="margin: 0; color: #64748b; font-size: 0.8rem; line-height: 1.4;">Your recent blood work results are now available</p>
                        <small style="color: #94a3b8; font-size: 0.75rem;">1 day ago</small>
                    </div>
                    <div class="notification-item" style="padding: 1rem; margin-bottom: 0.75rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 0.9rem; font-weight: 600;">Prescription Refill</h4>
                        <p style="margin: 0; color: #64748b; font-size: 0.8rem; line-height: 1.4;">Time to refill your Lisinopril prescription</p>
                        <small style="color: #94a3b8; font-size: 0.75rem;">3 days ago</small>
                    </div>
                </div>
                <div style="padding: 1rem; text-align: center; border-top: 1px solid #f1f5f9;">
                    <a href="messages.html" style="color: #667eea; text-decoration: none; font-size: 0.9rem; font-weight: 500;">View All Messages →</a>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
    }

    createHelpModal() {
        if (document.getElementById('helpModal')) return;

        const helpModalHTML = `
            <div class="modal-overlay" id="helpModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 15px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1e293b; font-size: 1.5rem;">Help & Support</h2>
                        <button onclick="oneCareNav.closeHelpModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; padding: 0.5rem;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="help-section" style="margin-bottom: 2rem;">
                            <h3 style="color: #667eea; margin-bottom: 1rem; font-size: 1.2rem;">Getting Started</h3>
                            <ul style="color: #64748b; line-height: 1.6; padding-left: 1.5rem;">
                                <li>Use the sidebar or navigation menu to browse different sections</li>
                                <li>Click on action cards and buttons to access key features</li>
                                <li>Check notifications regularly for important updates</li>
                                <li>Keep your profile information up to date</li>
                                <li>Use the search function to quickly find information</li>
                            </ul>
                        </div>
                        <div class="help-section" style="margin-bottom: 2rem;">
                            <h3 style="color: #667eea; margin-bottom: 1rem; font-size: 1.2rem;">Common Questions</h3>
                            <div style="color: #64748b; line-height: 1.6;">
                                <p style="margin-bottom: 1rem;"><strong>How do I schedule an appointment?</strong><br>
                                Navigate to the Appointments section and click "Schedule New Appointment"</p>
                                
                                <p style="margin-bottom: 1rem;"><strong>How do I view my medical records?</strong><br>
                                Go to Health Records to view, upload, and manage your documents</p>
                                
                                <p style="margin-bottom: 1rem;"><strong>How do I message my healthcare provider?</strong><br>
                                Use the Messages section for secure communication with your care team</p>

                                <p style="margin-bottom: 1rem;"><strong>How do I update my profile?</strong><br>
                                Click on your profile picture in the top menu and select "Profile Settings"</p>
                            </div>
                        </div>
                        <div class="help-section">
                            <h3 style="color: #667eea; margin-bottom: 1rem; font-size: 1.2rem;">Contact Support</h3>
                            <p style="color: #64748b; margin-bottom: 1rem;">If you need additional help, contact our support team:</p>
                            <div style="color: #64748b; line-height: 1.8;">
                                <p style="margin: 0.5rem 0;">📞 <strong>Phone:</strong> 1-800-ONECARE</p>
                                <p style="margin: 0.5rem 0;">📧 <strong>Email:</strong> support@onecare.com</p>
                                <p style="margin: 0.5rem 0;">💬 <strong>Live Chat:</strong> Available 24/7</p>
                                <p style="margin: 0.5rem 0;">🌐 <strong>Website:</strong> help.onecare.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', helpModalHTML);
    }

    createUploadModal() {
        if (document.getElementById('uploadModal')) return;

        const uploadModalHTML = `
            <div class="modal-overlay" id="uploadModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 15px; padding: 2rem; max-width: 500px; width: 90%;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1e293b;">Upload Document</h2>
                        <button onclick="oneCareNav.closeUploadModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
                    </div>
                    <form onsubmit="oneCareNav.handleUpload(event)">
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">Document Title*</label>
                            <input type="text" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">Category*</label>
                            <select required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                                <option value="">Select Category</option>
                                <option value="lab-results">Lab Results</option>
                                <option value="imaging">Imaging</option>
                                <option value="prescriptions">Prescriptions</option>
                                <option value="discharge-summary">Discharge Summary</option>
                                <option value="insurance">Insurance</option>
                                <option value="vaccination">Vaccination Records</option>
                                <option value="specialist-reports">Specialist Reports</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">File*</label>
                            <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px;">
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" onclick="oneCareNav.closeUploadModal()" style="padding: 0.75rem 1.5rem; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer;">Upload Document</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', uploadModalHTML);
    }

    createRecordModal() {
        if (document.getElementById('recordModal')) return;

        const recordModalHTML = `
            <div class="modal-overlay" id="recordModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 15px; padding: 2rem; max-width: 500px; width: 90%;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1e293b;">Create New Record</h2>
                        <button onclick="oneCareNav.closeRecordModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
                    </div>
                    <form onsubmit="oneCareNav.handleNewRecord(event)">
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">Record Title*</label>
                            <input type="text" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">Category*</label>
                            <select required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                                <option value="">Select Category</option>
                                <option value="lab-results">Lab Results</option>
                                <option value="imaging">Imaging</option>
                                <option value="prescriptions">Prescriptions</option>
                                <option value="visits">Doctor Visits</option>
                                <option value="vaccinations">Vaccinations</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">Date</label>
                            <input type="date" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600;">Notes</label>
                            <textarea rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" onclick="oneCareNav.closeRecordModal()" style="padding: 0.75rem 1.5rem; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer;">Create Record</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', recordModalHTML);
    }

    /**
     * Modal Close Functions
     */
    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) panel.style.display = 'none';
    }

    closeHelpModal() {
        const modal = document.getElementById('helpModal');
        if (modal) modal.style.display = 'none';
    }

    closeUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) modal.style.display = 'none';
    }

    closeRecordModal() {
        const modal = document.getElementById('recordModal');
        if (modal) modal.style.display = 'none';
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.style.display = 'none');
        
        const panels = document.querySelectorAll('#notificationPanel');
        panels.forEach(panel => panel.style.display = 'none');
        
        const dropdowns = document.querySelectorAll('.profile-dropdown .active, .user-profile-dropdown.active');
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    }

    /**
     * Form Handlers
     */
    handleUpload(event) {
        event.preventDefault();
        // Show success message
        this.showNotification('Document uploaded successfully!', 'success');
        this.closeUploadModal();
    }

    handleNewRecord(event) {
        event.preventDefault();
        // Show success message
        this.showNotification('Record created successfully!', 'success');
        this.closeRecordModal();
    }

    /**
     * Utility Functions
     */
    handleOutsideClicks(event) {
        // Close notification panel
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBtn = document.querySelector('.notification-btn, #notificationBtn');
        if (notificationPanel && notificationPanel.style.display === 'block' && 
            !notificationPanel.contains(event.target) && 
            !notificationBtn?.contains(event.target)) {
            this.closeNotificationPanel();
        }

        // Close profile dropdowns
        const profileDropdowns = document.querySelectorAll('.profile-dropdown, .user-profile-dropdown');
        profileDropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.profile-menu, .user-profile-dropdown');
            if (menu && !dropdown.contains(event.target)) {
                menu.classList.remove('active');
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification toast
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea'};
            color: white; padding: 1rem 1.5rem; border-radius: 8px;
            font-weight: 500; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transform: translateX(100%); transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    loadUserData() {
        // Load user data from localStorage
        const userName = localStorage.getItem('userName') || 'User';
        const userElements = document.querySelectorAll('#userName, .profile-name, #dropdownUserName');
        userElements.forEach(element => {
            if (element) element.textContent = userName;
        });
    }

    /**
     * Initialize all modals and functionality
     */
    initializeModals() {
        if (this.modalsInitialized) return;
        
        // The modals are created on demand
        this.modalsInitialized = true;
    }

    // Inline modal creation (fallback if profile-modal.js not loaded)
    createInlineProfileModal() {
        if (document.getElementById('inlineProfileModal')) {
            document.getElementById('inlineProfileModal').style.display = 'flex';
            return;
        }

        const profileModalHTML = `
            <div class="modal-overlay" id="inlineProfileModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 15px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1e293b;">Profile Settings</h2>
                        <button onclick="document.getElementById('inlineProfileModal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: #64748b; margin-bottom: 1rem;">Profile management features are being loaded...</p>
                        <p style="color: #64748b;">Please refresh the page if this modal doesn't load properly.</p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', profileModalHTML);
    }

    createInlineSettingsModal() {
        if (document.getElementById('inlineSettingsModal')) {
            document.getElementById('inlineSettingsModal').style.display = 'flex';
            return;
        }

        const settingsModalHTML = `
            <div class="modal-overlay" id="inlineSettingsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 15px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1e293b;">Account Settings</h2>
                        <button onclick="document.getElementById('inlineSettingsModal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: #64748b; margin-bottom: 1rem;">Settings management features are being loaded...</p>
                        <p style="color: #64748b;">Please refresh the page if this modal doesn't load properly.</p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', settingsModalHTML);
    }
}

// Global navigation functions for backward compatibility
function showNotifications() {
    oneCareNav.showNotifications();
}

function showHelpModal() {
    oneCareNav.showHelpModal();
}

function help() {
    oneCareNav.showHelpModal();
}

function openProfileSettings() {
    oneCareNav.openProfileSettings();
}

function viewProfile() {
    oneCareNav.openProfileSettings();
}

function accountSettings() {
    oneCareNav.openAccountSettings();
}

function showUploadModal() {
    oneCareNav.showUploadModal();
}

function createNewRecord() {
    oneCareNav.createNewRecord();
}

function clearSearch() {
    oneCareNav.clearSearch();
}

function toggleUserMenu() {
    oneCareNav.toggleUserMenu();
}

function logout() {
    oneCareNav.logout();
}

// Initialize global navigation instance
let oneCareNav;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        oneCareNav = new OneCareNavigation();
    });
} else {
    oneCareNav = new OneCareNavigation();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OneCareNavigation;
}