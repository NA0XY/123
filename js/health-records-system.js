/**
 * Health Records System JavaScript Module
 * Comprehensive health records management with upload, search, sharing, and visualization
 */

class HealthRecordsSystem {
    constructor() {
        this.records = new Map();
        this.currentView = 'grid';
        this.filters = {
            search: '',
            category: '',
            date: '',
            status: ''
        };
        this.sortBy = 'date-desc';
        this.selectedRecord = null;
        this.uploadedFiles = [];
        
        this.initializeSystem();
        this.loadSampleData();
        this.attachEventListeners();
        this.renderRecords();
    }

    initializeSystem() {
        console.log('🏥 Initializing Health Records System...');
        
        // Initialize profile modal integration
        if (typeof window.initializeProfileModal === 'function') {
            window.initializeProfileModal();
        }

        // Initialize drag and drop
        this.initializeDragDrop();
        
        // Set default date for new records
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('recordDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    loadSampleData() {
        const sampleRecords = [
            {
                id: 'rec_001',
                title: 'Annual Physical Exam Results',
                category: 'lab-results',
                description: 'Complete blood count, lipid panel, and basic metabolic panel results from annual physical examination.',
                date: '2024-01-15',
                provider: 'Dr. Sarah Johnson, Primary Care',
                status: 'reviewed',
                important: true,
                shared: false,
                fileType: 'pdf',
                fileSize: '245 KB',
                tags: ['annual', 'physical', 'blood-work']
            },
            {
                id: 'rec_002',
                title: 'Chest X-Ray - Pre-Surgery',
                category: 'imaging',
                description: 'Chest radiography performed as pre-operative clearance for upcoming procedure.',
                date: '2024-01-10',
                provider: 'Radiology Associates',
                status: 'reviewed',
                important: false,
                shared: true,
                fileType: 'jpg',
                fileSize: '1.2 MB',
                tags: ['chest', 'x-ray', 'pre-op']
            },
            {
                id: 'rec_003',
                title: 'Prescription - Lisinopril',
                category: 'prescriptions',
                description: 'Prescription for Lisinopril 10mg daily for blood pressure management.',
                date: '2024-01-08',
                provider: 'Dr. Sarah Johnson, Primary Care',
                status: 'pending',
                important: false,
                shared: false,
                fileType: 'pdf',
                fileSize: '156 KB',
                tags: ['prescription', 'hypertension', 'lisinopril']
            },
            {
                id: 'rec_004',
                title: 'Hospital Discharge Summary',
                category: 'discharge-summary',
                description: 'Discharge summary from recent hospitalization for pneumonia treatment.',
                date: '2024-01-05',
                provider: 'City General Hospital',
                status: 'reviewed',
                important: true,
                shared: true,
                fileType: 'pdf',
                fileSize: '532 KB',
                tags: ['discharge', 'pneumonia', 'hospitalization']
            },
            {
                id: 'rec_005',
                title: 'COVID-19 Vaccination Record',
                category: 'vaccination',
                description: 'Updated COVID-19 vaccination record including booster shots.',
                date: '2023-12-20',
                provider: 'Community Health Center',
                status: 'reviewed',
                important: true,
                shared: false,
                fileType: 'pdf',
                fileSize: '89 KB',
                tags: ['covid-19', 'vaccination', 'booster']
            },
            {
                id: 'rec_006',
                title: 'Cardiology Consultation Report',
                category: 'specialist-reports',
                description: 'Consultation report from cardiology visit regarding heart palpitations.',
                date: '2023-12-15',
                provider: 'Dr. Michael Chen, Cardiology',
                status: 'reviewed',
                important: true,
                shared: true,
                fileType: 'pdf',
                fileSize: '378 KB',
                tags: ['cardiology', 'consultation', 'palpitations']
            },
            {
                id: 'rec_007',
                title: 'Insurance Card - Front & Back',
                category: 'insurance',
                description: 'Current health insurance card images for reference.',
                date: '2023-12-01',
                provider: 'BlueCross BlueShield',
                status: 'archived',
                important: false,
                shared: false,
                fileType: 'jpg',
                fileSize: '445 KB',
                tags: ['insurance', 'card', 'reference']
            }
        ];

        sampleRecords.forEach(record => {
            this.records.set(record.id, record);
        });

        this.updateStatistics();
    }

    attachEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value;
                this.renderRecords();
            }, 300));
        }

        // Filter selects
        const categoryFilter = document.getElementById('categoryFilter');
        const dateFilter = document.getElementById('dateFilter');
        const statusFilter = document.getElementById('statusFilter');
        const sortSelect = document.getElementById('sortSelect');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.renderRecords();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
                this.renderRecords();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.renderRecords();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderRecords();
            });
        }

        // Upload form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', this.handleUpload.bind(this));
        }

        // Share form
        const shareForm = document.getElementById('shareForm');
        if (shareForm) {
            shareForm.addEventListener('submit', this.handleShare.bind(this));
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        if (fileInput && uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Profile dropdown
        this.initializeProfileDropdown();
    }

    initializeProfileDropdown() {
        const profileBtn = document.getElementById('profileBtn');
        const profileMenu = document.getElementById('profileMenu');
        const profileDropdown = document.querySelector('.profile-dropdown');

        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('open');
            });

            document.addEventListener('click', () => {
                profileDropdown.classList.remove('open');
            });

            profileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    initializeDragDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        if (uploadArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, this.preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.add('drag-over');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.remove('drag-over');
                }, false);
            });

            uploadArea.addEventListener('drop', this.handleDrop.bind(this), false);
        }
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    processFiles(files) {
        this.uploadedFiles = [];
        
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadedFiles.push(file);
            }
        });

        this.updateUploadPreview();
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                             'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (file.size > maxSize) {
            this.showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showNotification(`File type "${file.type}" is not supported.`, 'error');
            return false;
        }

        return true;
    }

    updateUploadPreview() {
        const uploadArea = document.getElementById('uploadArea');
        const uploadContent = uploadArea.querySelector('.upload-content');
        
        if (this.uploadedFiles.length > 0) {
            const filesList = this.uploadedFiles.map(file => 
                `<div class="uploaded-file">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${this.formatFileSize(file.size)})</span>
                </div>`
            ).join('');

            uploadContent.innerHTML = `
                <svg class="upload-icon" viewBox="0 0 24 24">
                    <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                </svg>
                <p class="upload-text">${this.uploadedFiles.length} file(s) selected</p>
                ${filesList}
            `;
        } else {
            uploadContent.innerHTML = `
                <svg class="upload-icon" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <p class="upload-text">Drag and drop files here or <span class="upload-link">browse</span></p>
                <p class="upload-hint">Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
            `;
        }
    }

    handleUpload(e) {
        e.preventDefault();
        
        if (this.uploadedFiles.length === 0) {
            this.showNotification('Please select files to upload.', 'error');
            return;
        }

        const formData = new FormData(e.target);
        
        // Validate required fields
        const title = formData.get('recordTitle');
        const category = formData.get('recordCategory');
        
        if (!title || !category) {
            this.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        this.simulateUpload().then(() => {
            const newRecord = {
                id: `rec_${Date.now()}`,
                title: title,
                category: category,
                description: formData.get('recordDescription') || '',
                date: formData.get('recordDate') || new Date().toISOString().split('T')[0],
                provider: formData.get('recordProvider') || 'Unknown Provider',
                status: 'pending',
                important: formData.get('markImportant') === 'on',
                shared: formData.get('autoShare') === 'on',
                fileType: this.getFileExtension(this.uploadedFiles[0].name),
                fileSize: this.formatFileSize(this.uploadedFiles[0].size),
                tags: this.generateTags(title, category)
            };

            this.records.set(newRecord.id, newRecord);
            this.updateStatistics();
            this.renderRecords();
            this.closeUploadModal();
            this.showNotification('Document uploaded successfully!', 'success');
        });
    }

    simulateUpload() {
        return new Promise((resolve) => {
            const progressBar = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');

            if (progressBar) {
                progressBar.style.display = 'block';
                
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 20;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                        setTimeout(() => {
                            progressBar.style.display = 'none';
                            resolve();
                        }, 500);
                    }
                    
                    if (progressFill) progressFill.style.width = `${progress}%`;
                    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
                }, 100);
            } else {
                setTimeout(resolve, 1000);
            }
        });
    }

    handleShare(e) {
        e.preventDefault();
        
        if (!this.selectedRecord) {
            this.showNotification('No record selected for sharing.', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const emails = formData.get('shareEmail');
        
        if (!emails) {
            this.showNotification('Please enter at least one email address.', 'error');
            return;
        }

        // Update record status
        this.selectedRecord.shared = true;
        this.selectedRecord.status = 'shared';
        
        this.records.set(this.selectedRecord.id, this.selectedRecord);
        this.updateStatistics();
        this.renderRecords();
        this.closeShareModal();
        this.showNotification('Document shared successfully!', 'success');
    }

    renderRecords() {
        const filteredRecords = this.getFilteredRecords();
        const sortedRecords = this.sortRecords(filteredRecords);

        if (sortedRecords.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
            this.renderView(sortedRecords);
        }
    }

    getFilteredRecords() {
        return Array.from(this.records.values()).filter(record => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                if (!record.title.toLowerCase().includes(searchTerm) &&
                    !record.description.toLowerCase().includes(searchTerm) &&
                    !record.provider.toLowerCase().includes(searchTerm) &&
                    !record.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
                    return false;
                }
            }

            // Category filter
            if (this.filters.category && record.category !== this.filters.category) {
                return false;
            }

            // Status filter
            if (this.filters.status && record.status !== this.filters.status) {
                return false;
            }

            // Date filter
            if (this.filters.date) {
                const recordDate = new Date(record.date);
                const now = new Date();
                const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

                switch (this.filters.date) {
                    case 'last-week':
                        if (daysDiff > 7) return false;
                        break;
                    case 'last-month':
                        if (daysDiff > 30) return false;
                        break;
                    case 'last-3-months':
                        if (daysDiff > 90) return false;
                        break;
                    case 'last-year':
                        if (daysDiff > 365) return false;
                        break;
                }
            }

            return true;
        });
    }

    sortRecords(records) {
        return records.sort((a, b) => {
            switch (this.sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'name-asc':
                    return a.title.localeCompare(b.title);
                case 'name-desc':
                    return b.title.localeCompare(a.title);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'importance':
                    if (a.important && !b.important) return -1;
                    if (!a.important && b.important) return 1;
                    return new Date(b.date) - new Date(a.date);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
    }

    renderView(records) {
        switch (this.currentView) {
            case 'grid':
                this.renderGridView(records);
                break;
            case 'list':
                this.renderListView(records);
                break;
            case 'timeline':
                this.renderTimelineView(records);
                break;
        }
    }

    renderGridView(records) {
        const gridContainer = document.getElementById('recordsGrid');
        const listContainer = document.getElementById('recordsList');
        const timelineContainer = document.getElementById('recordsTimeline');

        if (gridContainer) gridContainer.style.display = 'grid';
        if (listContainer) listContainer.style.display = 'none';
        if (timelineContainer) timelineContainer.style.display = 'none';

        if (gridContainer) {
            gridContainer.innerHTML = records.map(record => this.createRecordCard(record)).join('');
        }
    }

    renderListView(records) {
        const gridContainer = document.getElementById('recordsGrid');
        const listContainer = document.getElementById('recordsList');
        const timelineContainer = document.getElementById('recordsTimeline');

        if (gridContainer) gridContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        if (timelineContainer) timelineContainer.style.display = 'none';

        if (listContainer) {
            listContainer.innerHTML = `
                <div class="list-header">
                    <div>Document</div>
                    <div>Category</div>
                    <div>Date</div>
                    <div>Provider</div>
                    <div>Status</div>
                </div>
                ${records.map(record => this.createListItem(record)).join('')}
            `;
        }
    }

    renderTimelineView(records) {
        const gridContainer = document.getElementById('recordsGrid');
        const listContainer = document.getElementById('recordsList');
        const timelineContainer = document.getElementById('recordsTimeline');

        if (gridContainer) gridContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'none';
        if (timelineContainer) timelineContainer.style.display = 'block';

        if (timelineContainer) {
            timelineContainer.innerHTML = `
                <div class="timeline-line"></div>
                ${records.map(record => this.createTimelineItem(record)).join('')}
            `;
        }
    }

    createRecordCard(record) {
        const categoryName = this.getCategoryName(record.category);
        const statusIcon = this.getStatusIcon(record.status);
        const formattedDate = this.formatDate(record.date);
        const importantClass = record.important ? 'record-important' : '';

        return `
            <div class="record-card ${importantClass}" onclick="showRecordDetail('${record.id}')">
                <div class="record-header">
                    <h3 class="record-title">${record.title}</h3>
                    <div class="record-meta">
                        <span class="record-category">${categoryName}</span>
                        <span class="record-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                            </svg>
                            ${formattedDate}
                        </span>
                    </div>
                </div>
                <div class="record-body">
                    <p class="record-description">${record.description}</p>
                    <div class="record-provider">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                        ${record.provider}
                    </div>
                </div>
                <div class="record-footer">
                    <div class="record-status ${record.status}">
                        <span class="status-dot"></span>
                        ${record.status}
                    </div>
                    <div class="record-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); downloadRecord('${record.id}')" title="Download">
                            <svg viewBox="0 0 24 24">
                                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); shareRecordById('${record.id}')" title="Share">
                            <svg viewBox="0 0 24 24">
                                <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A1.92,1.92 0 0,0 19,17.08C18.64,17.08 18.31,17.22 18.04,17.45L18,16.08Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createListItem(record) {
        const categoryName = this.getCategoryName(record.category);
        const formattedDate = this.formatDate(record.date);

        return `
            <div class="list-item" onclick="showRecordDetail('${record.id}')">
                <div>
                    <div class="list-item-title">${record.title}</div>
                    <div class="list-item-description">${record.description}</div>
                </div>
                <div>${categoryName}</div>
                <div>${formattedDate}</div>
                <div>${record.provider}</div>
                <div class="record-status ${record.status}">
                    <span class="status-dot"></span>
                    ${record.status}
                </div>
            </div>
        `;
    }

    createTimelineItem(record) {
        const formattedDate = this.formatDate(record.date);
        const categoryName = this.getCategoryName(record.category);

        return `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-date">${formattedDate}</div>
                <div class="timeline-card" onclick="showRecordDetail('${record.id}')">
                    <h4>${record.title}</h4>
                    <p class="record-category">${categoryName}</p>
                    <p>${record.description}</p>
                    <div class="record-provider">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                        ${record.provider}
                    </div>
                </div>
            </div>
        `;
    }

    showRecordDetail(recordId) {
        const record = this.records.get(recordId);
        if (!record) return;

        this.selectedRecord = record;
        const modal = document.getElementById('recordDetailModal');
        const title = document.getElementById('recordDetailTitle');
        const details = document.getElementById('recordDetails');

        if (title) title.textContent = record.title;
        if (details) {
            details.innerHTML = this.createRecordDetailsView(record);
        }

        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    createRecordDetailsView(record) {
        const categoryName = this.getCategoryName(record.category);
        const formattedDate = this.formatDate(record.date);

        return `
            <div class="detail-section">
                <h4>Document Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Title</span>
                        <span class="detail-value">${record.title}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Category</span>
                        <span class="detail-value">${categoryName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Provider</span>
                        <span class="detail-value">${record.provider}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value record-status ${record.status}">
                            <span class="status-dot"></span>
                            ${record.status}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">File Size</span>
                        <span class="detail-value">${record.fileSize}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Description</h4>
                <p>${record.description || 'No description provided.'}</p>
            </div>
            
            <div class="document-preview">
                <div class="preview-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                </div>
                <h4>${record.title}</h4>
                <p>File Type: ${record.fileType.toUpperCase()} • Size: ${record.fileSize}</p>
            </div>
            
            ${record.tags.length > 0 ? `
                <div class="detail-section">
                    <h4>Tags</h4>
                    <div class="tags-container">
                        ${record.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    updateStatistics() {
        const totalRecords = this.records.size;
        const thisMonthRecords = Array.from(this.records.values()).filter(record => {
            const recordDate = new Date(record.date);
            const now = new Date();
            return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
        }).length;
        const sharedRecords = Array.from(this.records.values()).filter(record => record.shared).length;
        const importantRecords = Array.from(this.records.values()).filter(record => record.important).length;

        const totalEl = document.getElementById('totalRecords');
        const recentEl = document.getElementById('recentRecords');
        const sharedEl = document.getElementById('sharedRecords');
        const importantEl = document.getElementById('importantRecords');

        if (totalEl) totalEl.textContent = totalRecords;
        if (recentEl) recentEl.textContent = thisMonthRecords;
        if (sharedEl) sharedEl.textContent = sharedRecords;
        if (importantEl) importantEl.textContent = importantRecords;
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const recordsContainer = document.getElementById('recordsContainer');
        
        if (emptyState && recordsContainer) {
            emptyState.style.display = 'block';
            recordsContainer.style.display = 'none';
        }
    }

    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const recordsContainer = document.getElementById('recordsContainer');
        
        if (emptyState && recordsContainer) {
            emptyState.style.display = 'none';
            recordsContainer.style.display = 'block';
        }
    }

    // Helper methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    getCategoryName(category) {
        const categories = {
            'lab-results': 'Lab Results',
            'imaging': 'Imaging',
            'prescriptions': 'Prescriptions',
            'discharge-summary': 'Discharge Summary',
            'insurance': 'Insurance',
            'vaccination': 'Vaccination Records',
            'specialist-reports': 'Specialist Reports',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    getStatusIcon(status) {
        const icons = {
            'reviewed': '✓',
            'pending': '⏳',
            'shared': '📤',
            'archived': '📁'
        };
        return icons[status] || '📄';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    generateTags(title, category) {
        const tags = [];
        const commonWords = title.toLowerCase().split(' ').filter(word => 
            word.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(word)
        );
        tags.push(...commonWords.slice(0, 3));
        tags.push(category);
        return [...new Set(tags)]; // Remove duplicates
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for event handlers
function switchView(view) {
    if (window.healthRecordsSystem) {
        window.healthRecordsSystem.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}ViewBtn`).classList.add('active');
        
        window.healthRecordsSystem.renderRecords();
    }
}

function sortRecords() {
    if (window.healthRecordsSystem) {
        window.healthRecordsSystem.renderRecords();
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        if (window.healthRecordsSystem) {
            window.healthRecordsSystem.filters.search = '';
            window.healthRecordsSystem.renderRecords();
        }
    }
}

function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('uploadForm');
        if (form) form.reset();
        if (window.healthRecordsSystem) {
            window.healthRecordsSystem.uploadedFiles = [];
            window.healthRecordsSystem.updateUploadPreview();
        }
    }
}

function showRecordDetail(recordId) {
    if (window.healthRecordsSystem) {
        window.healthRecordsSystem.showRecordDetail(recordId);
    }
}

function closeRecordDetail() {
    const modal = document.getElementById('recordDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function shareRecordById(recordId) {
    if (window.healthRecordsSystem) {
        const record = window.healthRecordsSystem.records.get(recordId);
        if (record) {
            window.healthRecordsSystem.selectedRecord = record;
            showShareModal();
        }
    }
}

function shareRecord() {
    showShareModal();
}

function showShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('shareForm');
        if (form) form.reset();
    }
}

function downloadRecord(recordId) {
    if (window.healthRecordsSystem) {
        const record = window.healthRecordsSystem.records.get(recordId);
        if (record) {
            // Simulate download
            window.healthRecordsSystem.showNotification(`Downloading ${record.title}...`, 'info');
            // In a real implementation, this would trigger an actual file download
        }
    }
}

function editRecord() {
    if (window.healthRecordsSystem && window.healthRecordsSystem.selectedRecord) {
        window.healthRecordsSystem.showNotification('Edit functionality coming soon!', 'info');
        closeRecordDetail();
    }
}

function createNewRecord() {
    showUploadModal();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.healthRecordsSystem = new HealthRecordsSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthRecordsSystem;
}