// Profile Modal Functionality for OneCare Patient Pages
// This script provides reusable profile and settings modal functionality

// Profile Modal HTML Structure
const profileModalHTML = `
<div class="modal-overlay" id="profileModal" style="display: none;">
    <div class="modal-container">
        <div class="modal-header">
            <h2 class="modal-title">My Profile</h2>
            <button class="modal-close" onclick="closeProfileModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="profileForm">
                <div class="profile-section">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar">
                            <img id="profileAvatar" src="data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23667eea'/%3E%3Cpath d='M40 40a10 10 0 100-20 10 10 0 000 20zM40 44c-11 0-20 6-20 12v8h40v-8c0-6-9-12-20-12z' fill='white'/%3E%3C/svg%3E" alt="Profile">
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="changeProfilePicture()">
                            <i class="fas fa-camera"></i>
                            Change Photo
                        </button>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" name="firstName" value="John" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" name="lastName" value="Doe" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" value="john.doe@email.com" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone" value="+1 (555) 123-4567">
                    </div>
                    <div class="form-group">
                        <label for="dateOfBirth">Date of Birth</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" value="1990-01-15">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender" name="gender">
                            <option value="male" selected>Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label for="address">Address</label>
                        <textarea id="address" name="address" rows="2">123 Main Street, City, State 12345</textarea>
                    </div>
                </div>

                <div class="medical-info-section">
                    <h3>Medical Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="bloodType">Blood Type</label>
                            <select id="bloodType" name="bloodType">
                                <option value="">Select...</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+" selected>AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="height">Height (cm)</label>
                            <input type="number" id="height" name="height" value="175">
                        </div>
                        <div class="form-group">
                            <label for="weight">Weight (kg)</label>
                            <input type="number" id="weight" name="weight" value="70">
                        </div>
                        <div class="form-group">
                            <label for="emergencyContact">Emergency Contact</label>
                            <input type="text" id="emergencyContact" name="emergencyContact" value="Jane Smith - (555) 123-4568">
                        </div>
                        <div class="form-group full-width">
                            <label for="allergies">Known Allergies</label>
                            <textarea id="allergies" name="allergies" rows="2" placeholder="List any known allergies...">Penicillin, Shellfish</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="medicalConditions">Medical Conditions</label>
                            <textarea id="medicalConditions" name="medicalConditions" rows="2" placeholder="List any chronic conditions...">Hypertension, Type 2 Diabetes</textarea>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeProfileModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>`;

// Settings Modal HTML Structure
const settingsModalHTML = `
<div class="modal-overlay" id="settingsModal" style="display: none;">
    <div class="modal-container">
        <div class="modal-header">
            <h2 class="modal-title">Settings</h2>
            <button class="modal-close" onclick="closeSettingsModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="settings-sections">
                <div class="settings-section">
                    <h3>Notifications</h3>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Appointment Reminders</label>
                                <span class="setting-description">Get notified about upcoming appointments</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="appointmentReminders" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Medication Reminders</label>
                                <span class="setting-description">Get reminded to take your medications</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="medicationReminders" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Health Screening Alerts</label>
                                <span class="setting-description">Get alerts for due screenings</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="screeningAlerts" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Email Notifications</label>
                                <span class="setting-description">Receive notifications via email</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="emailNotifications">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>SMS Notifications</label>
                                <span class="setting-description">Receive notifications via text message</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="smsNotifications" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Privacy & Security</h3>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Two-Factor Authentication</label>
                                <span class="setting-description">Add an extra layer of security</span>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="setup2FA()">Setup</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Login History</label>
                                <span class="setting-description">View recent login activity</span>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="viewLoginHistory()">View</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Data Sharing</label>
                                <span class="setting-description">Control who can access your health data</span>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="manageDataSharing()">Manage</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Account</h3>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Change Password</label>
                                <span class="setting-description">Update your account password</span>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="changePassword()">Change</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Download My Data</label>
                                <span class="setting-description">Export your health information</span>
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="downloadData()">Download</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Delete Account</label>
                                <span class="setting-description">Permanently delete your account</span>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="deleteAccount()">Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeSettingsModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
            </div>
        </div>
    </div>
</div>`;

// Initialize modals when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add modal HTML to the body
    document.body.insertAdjacentHTML('beforeend', profileModalHTML);
    document.body.insertAdjacentHTML('beforeend', settingsModalHTML);
    
    // Add modal CSS if not already present
    if (!document.getElementById('modalStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modalStyles';
        styleSheet.textContent = modalCSS;
        document.head.appendChild(styleSheet);
    }

    // Load user profile data
    loadUserProfile();
    loadUserSettings();
});

// Modal CSS
const modalCSS = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
}

.modal-container {
    background: white;
    border-radius: 15px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f5f9;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.modal-body {
    padding: 2rem;
}

.profile-section {
    margin-bottom: 2rem;
}

.profile-avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.profile-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #667eea;
}

.profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.medical-info-section {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.medical-info-section h3 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.settings-sections {
    space-y: 2rem;
}

.settings-section {
    margin-bottom: 2rem;
}

.settings-section h3 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.settings-group {
    space-y: 1rem;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.setting-info {
    flex: 1;
}

.setting-info label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.25rem;
}

.setting-description {
    font-size: 0.85rem;
    color: #6b7280;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 24px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .toggle-slider {
    background-color: #667eea;
}

input:checked + .toggle-slider:before {
    transform: translateX(26px);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
    background: #e2e8f0;
    color: #1e293b;
}

.btn-danger {
    background: #ef4444;
    color: white;
}

.btn-danger:hover {
    background: #dc2626;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
}

@media (max-width: 768px) {
    .modal-container {
        width: 95%;
        margin: 1rem;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
`;

// Profile Modal Functions
function showProfileModal() {
    document.getElementById('profileModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showSettingsModal() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Profile Data Management
function loadUserProfile() {
    // In a real app, this would fetch from an API
    const userData = localStorage.getItem('userProfile');
    if (userData) {
        const profile = JSON.parse(userData);
        populateProfileForm(profile);
    }
}

function populateProfileForm(profile) {
    const form = document.getElementById('profileForm');
    if (!form) return;

    Object.keys(profile).forEach(key => {
        const element = form.querySelector(`[name="${key}"]`);
        if (element) {
            element.value = profile[key];
        }
    });
}

function saveProfile() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    const profile = Object.fromEntries(formData);

    // Save to localStorage (in real app, would save to API)
    localStorage.setItem('userProfile', JSON.stringify(profile));

    // Update user name in UI
    if (profile.firstName && profile.lastName) {
        const userName = `${profile.firstName} ${profile.lastName}`;
        localStorage.setItem('userName', userName);
        
        // Update all user name displays on current page
        document.querySelectorAll('#userName, #dropdownUserName').forEach(el => {
            if (el) el.textContent = userName;
        });
    }

    alert('Profile updated successfully!');
    closeProfileModal();
}

// Settings Management
function loadUserSettings() {
    const settings = localStorage.getItem('userSettings');
    if (settings) {
        const userSettings = JSON.parse(settings);
        populateSettingsForm(userSettings);
    }
}

function populateSettingsForm(settings) {
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element && element.type === 'checkbox') {
            element.checked = settings[key];
        }
    });
}

function saveSettings() {
    const settings = {
        appointmentReminders: document.getElementById('appointmentReminders')?.checked || false,
        medicationReminders: document.getElementById('medicationReminders')?.checked || false,
        screeningAlerts: document.getElementById('screeningAlerts')?.checked || false,
        emailNotifications: document.getElementById('emailNotifications')?.checked || false,
        smsNotifications: document.getElementById('smsNotifications')?.checked || false
    };

    localStorage.setItem('userSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
    closeSettingsModal();
}

// Profile Form Handler
document.addEventListener('submit', function(e) {
    if (e.target.id === 'profileForm') {
        e.preventDefault();
        saveProfile();
    }
});

// Additional Functions
function changeProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profileAvatar').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function setup2FA() {
    alert('Two-Factor Authentication setup coming soon!');
}

function viewLoginHistory() {
    alert('Login history feature coming soon!');
}

function manageDataSharing() {
    alert('Data sharing management coming soon!');
}

function changePassword() {
    alert('Change password feature coming soon!');
}

function downloadData() {
    alert('Data export feature coming soon!');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        alert('Account deletion feature coming soon!');
    }
}

// Export functions for global use
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;